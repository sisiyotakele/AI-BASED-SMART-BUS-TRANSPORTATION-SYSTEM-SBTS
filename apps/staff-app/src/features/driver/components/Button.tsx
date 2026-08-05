interface Props {
  text: string;
  disabled?: boolean;
}
function Button({ text, disabled }: Props) {
  return (
    <button 
      type="submit"
      disabled={disabled}
    >
      {text}
    </button>
  );
}
export default Button;