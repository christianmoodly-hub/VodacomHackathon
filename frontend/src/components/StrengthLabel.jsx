import LevelMeter from "./LevelMeter.jsx";

const filledFor = { Strong: 3, Moderate: 2, Weak: 1 };

export default function StrengthLabel({ strength, className }) {
  return <LevelMeter filled={filledFor[strength]} label={strength} srPrefix="Lead strength" className={className} />;
}
