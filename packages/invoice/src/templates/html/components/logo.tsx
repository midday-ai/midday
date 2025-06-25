type Props = {
	logo: string;
	customerName: string;
};

export function Logo({ logo, customerName }: Props) {
	return (
		<div className="max-w-[300px]">
			<img
				src={logo}
				alt={customerName}
				style={{
					height: 80,
					objectFit: "contain",
				}}
			/>
		</div>
	);
}
