 import type { ReactNode } from "react";
interface Props {
name: string;
label: string;
type?: string;
placeholder: string;
value: string;
onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
icon?: ReactNode;
error?: boolean;
}
function InputField({
name,
label,
type = "text",
placeholder,
value,
onChange,
icon,
error,
}: Props) {
return (
<div className="input-group">
  <label>{label}</label>
  <div className={`input-wrapper ${error ? "input-error" : ""}`}>
    {icon && (
      <span className="input-icon">
        {icon}
      </span>
    )}
    <input
      name={name}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  </div>
</div>
);
}
export default InputField;