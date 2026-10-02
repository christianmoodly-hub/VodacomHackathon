import LevelMeter from "./LevelMeter";

const filledFor = { Strong: 3, Moderate: 2, Weak: 1 };

export default function StrengthLabel({ strength }) {
  return <LevelMeter filled={filledFor[strength] || 1} label={strength} />;
}
