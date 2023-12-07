export function PinInput({ numberOfInputs = 6 }) {
  const inputs = [...Array(numberOfInputs)];
  const focusNextInput = (nextIdx: number) => {};

  return (
    <div>
      <div className="flex mb-2 space-x-2 rtl:space-x-reverse">
        {inputs.map((_, idx) => (
          <input
            key={idx}
            type="text"
            maxLength={1}
            onKeyUp={() => focusNextInput(idx + 1)}
            id="code-1"
            className="block text-sm text-center border border-input bg-transparent rounded-md w-[46px] h-[46px]"
            required
          />
        ))}
      </div>
      <p
        id="helper-text-explanation"
        className="mt-2 text-sm text-gray-500 dark:text-gray-400"
      >
        Please introduce the 6 digit code we sent via email.
      </p>
    </div>
  );
}
