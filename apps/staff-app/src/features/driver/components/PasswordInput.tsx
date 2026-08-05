import { useState } from "react";
import { FaEye, FaEyeSlash, FaLock } from "react-icons/fa";

interface Props {
  name: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: boolean;
}

function PasswordInput({
  name,
  label,
  placeholder,
  value,
  onChange,
  error,
}: Props) {
  const [show, setShow] = useState(false);
  return (
    <div className="input-group">
      <label>{label}</label>
      <div className={`input-wrapper ${error ? "input-error" : ""}`}>
        <FaLock className="input-icon" />
        <input
          type={show ? "text" : "password"}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
        <span
          className="eye-icon"
          onClick={() => setShow(!show)}
        >
          {show ? <FaEyeSlash /> : <FaEye />}
        </span>
      </div>

    </div>
  );
}

export default PasswordInput;