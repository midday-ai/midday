export function SectionStart() {
  return (
    <div className="min-h-screen">
      <span className="absolute right-4 top-4 text-lg md:right-8">
        Pitch/2024
      </span>

      <div className="container relative flex min-h-screen flex-1 gap-1 p-[5%]">
        {/* <div className="absolute bottom-auto mt-[150px] -ml-[35px] md:ml-0 md:mt-0 md:bottom-[650px] scale-50 md:scale-100">
          <div className="flex flex-1 gap-2">
            <Icons.Logo style={{ width: 200, height: 200 }} />
          </div>
        </div> */}
        <h1 className="absolute bottom-[250px] left-2 text-[110px] md:bottom-8 md:left-auto md:right-0 md:text-[370px]">
          Solomon AI
        </h1>
      </div>
    </div>
  );
}
