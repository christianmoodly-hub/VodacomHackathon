"""Find geographic clusters in active cases and save them as hotspots.

This Lambda can run on a schedule or through API Gateway. It does not need
a request body.
"""

import json
import math
import os

from backend.services.dynamodb import (
    DynamoDBError,
    get_recent_cases,
    update_hotspot_record,
)


# Cases within this distance of each other belong to the same zone.
DEFAULT_RADIUS_KM = 5.0
EARTH_RADIUS_KM = 6371.0

# A hotspot needs at least this many active cases.
MIN_CLUSTER_SIZE = 2

# Four or more cases, or any high/critical report, is a high-risk zone.
HIGH_RISK_CASE_COUNT = 4
HIGH_SEVERITIES = {"high", "critical"}


def _response(status_code, payload):
    """Build an API Gateway proxy response with a JSON body."""
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(payload),
    }


def _cluster_radius_km():
    """Read the grouping distance from the environment, defaulting to 5 km."""
    raw = os.environ.get("HOTSPOT_RADIUS_KM", str(DEFAULT_RADIUS_KM))
    try:
        radius = float(raw)
    except (TypeError, ValueError) as error:
        raise DynamoDBError("HOTSPOT_RADIUS_KM must be a number") from error
    if radius <= 0:
        raise DynamoDBError("HOTSPOT_RADIUS_KM must be greater than zero")
    return radius


def _coordinates(case):
    """Return (latitude, longitude) or None when a case has no usable location."""
    coordinates = case.get("coordinates")
    if not isinstance(coordinates, dict):
        return None
    try:
        latitude = float(coordinates["latitude"])
        longitude = float(coordinates["longitude"])
    except (KeyError, TypeError, ValueError):
        return None
    if not -90 <= latitude <= 90 or not -180 <= longitude <= 180:
        return None
    return latitude, longitude


def _distance_km(origin, other):
    """Great-circle distance between two latitude/longitude pairs."""
    lat1, lon1 = origin
    lat2, lon2 = other
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    chord = (
        math.sin(delta_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    )
    return 2 * EARTH_RADIUS_KM * math.asin(math.sqrt(chord))


def _latest_cases(cases):
    """Keep the newest item for each case_id. History rows should not double-count."""
    latest = {}
    for case in cases:
        case_id = case.get("case_id")
        if not isinstance(case_id, str) or not case_id:
            continue
        current = latest.get(case_id)
        if current is None or case.get("timestamp", 0) >= current.get("timestamp", 0):
            latest[case_id] = case
    return list(latest.values())


def _find_clusters(cases, radius_km):
    """Group cases whose locations are connected within radius_km."""
    points = []
    skipped = 0
    for case in _latest_cases(cases):
        coordinates = _coordinates(case)
        if coordinates is None:
            skipped += 1
            continue
        points.append((case, coordinates))

    parent = list(range(len(points)))

    def find(index):
        while parent[index] != index:
            parent[index] = parent[parent[index]]
            index = parent[index]
        return index

    def union(left, right):
        left_root = find(left)
        right_root = find(right)
        if left_root != right_root:
            parent[right_root] = left_root

    for left in range(len(points)):
        for right in range(left + 1, len(points)):
            if _distance_km(points[left][1], points[right][1]) <= radius_km:
                union(left, right)

    groups = {}
    for index, point in enumerate(points):
        groups.setdefault(find(index), []).append(point)

    clusters = [group for group in groups.values() if len(group) >= MIN_CLUSTER_SIZE]
    return clusters, skipped, len(points)


def _risk_level(cluster):
    """Rate a cluster from how many cases it holds and how severe they are."""
    severities = {
        str(case.get("severity", "")).strip().lower() for case, _ in cluster
    }
    if len(cluster) >= HIGH_RISK_CASE_COUNT or severities & HIGH_SEVERITIES:
        return "HIGH"
    return "MODERATE"


def _hotspot_from_cluster(cluster):
    """Build the hotspot payload for one cluster, including its saved fields."""
    latitudes = [coordinates[0] for _, coordinates in cluster]
    longitudes = [coordinates[1] for _, coordinates in cluster]
    center = (sum(latitudes) / len(cluster), sum(longitudes) / len(cluster))
    farthest_km = max(_distance_km(center, coordinates) for _, coordinates in cluster)
    case_ids = [case.get("case_id") for case, _ in cluster]
    hotspot_id = f"hs-{center[0]:.2f}-{center[1]:.2f}"

    return {
        "hotspot_id": hotspot_id,
        "radius": max(round(farthest_km * 1000), 1),
        "risk_level": _risk_level(cluster),
        "active_case_count": len(cluster),
        "center": {"latitude": round(center[0], 6), "longitude": round(center[1], 6)},
        "case_ids": case_ids,
    }


def lambda_handler(event, context):
    """Analyze active cases and save any newly detected hotspots."""
    del event, context

    try:
        cases = get_recent_cases()
        clusters, skipped_case_count, located_case_count = _find_clusters(
            cases, _cluster_radius_km()
        )
        hotspots = []
        for cluster in clusters:
            hotspot = _hotspot_from_cluster(cluster)
            saved = update_hotspot_record(
                hotspot["hotspot_id"],
                {
                    "radius": hotspot["radius"],
                    "risk_level": hotspot["risk_level"],
                    "active_case_count": hotspot["active_case_count"],
                    "latitude": hotspot["center"]["latitude"],
                    "longitude": hotspot["center"]["longitude"],
                },
            )
            hotspots.append({**saved, "center": hotspot["center"], "case_ids": hotspot["case_ids"]})
    except DynamoDBError as error:
        return _response(500, {"error": str(error)})
    except Exception:
        return _response(500, {"error": "Failed to correlate cases"})

    return _response(
        200,
        {
            "analyzed_case_count": located_case_count,
            "skipped_case_count": skipped_case_count,
            "cluster_count": len(hotspots),
            "hotspots": hotspots,
        },
    )
