// import BaseTypewriter from "typewriter-effect";

export function Typewriter({ text }) {
  return (
    <div className="text-[#878787] font-mono text-2xl mt-8">
      <h2>{text}</h2>
      {/* <BaseTypewriter
        options={{ delay: 30 }}
        onInit={(typewriter) => {
          typewriter.typeString(text).start();
        }}
      /> */}
    </div>
  );
}
