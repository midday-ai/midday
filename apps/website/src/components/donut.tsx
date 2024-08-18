import Spline from "@splinetool/react-spline/next";

export async function Donut() {
  return (
    <div className="animate-webgl-scale-in-fade">
      <Spline
        scene="https://prod.spline.design/I1f8fchdJE1WyzX4/scene.splinecode"
        style={{
          width: "auto",
          height: "auto",
          background: "transparent",
        }}
      />
    </div>
  );
}
