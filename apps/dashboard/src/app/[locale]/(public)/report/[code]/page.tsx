import { Chart } from "@/components/charts/chart";

export default async function Report() {
  return (
    <div className="h-screen flex flex-col">
      <div className="flex items-center justify-center w-full h-[80px] border-b-[1px]">
        <div className="flex items-center flex-col">
          <div>Lost Island AB</div>
          <span className="text-[#878787]">Profit/Loss</span>
        </div>
      </div>

      <div className="justify-center items-center w-full flex mt-[180px]">
        <div className="w-[1200px]">
          <Chart
            value="profit_loss"
            defaultValue={{ from: "2023-01-01", to: "2024-02-29" }}
          />
        </div>
      </div>

      <footer className="flex items-center justify-center w-full mt-auto h-[80px]">
        <div>
          <p className="text-[#878787] text-sm">
            Powered by{" "}
            <a href="#" className="text-white">
              Midday
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
