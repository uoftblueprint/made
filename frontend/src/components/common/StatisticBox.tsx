import * as React from "react";
import Card from "./Card";

const StatisticBox: React.FC<{
  title: string;
  value: number | string;
  iconName: string;
}> = ({ title, value, iconName }) => {
  return (
  <Card
    className="h-36 w-full"
    radius="md"
    border="on"
    bg="card"
    padding="lg"
    shadow="sm"
  >
      <div className="h-full flex flex-col items-start justify-center gap-1">
        <img
          src={`/icons/${iconName}.svg`}
          alt=""
          aria-hidden="true"
          className="h-6 w-6"
        />

        <div className="flex flex-col">
          <div className="font-bold text-3xl text-primary">{value}</div>
          <div className="text-sm text-muted">{title}</div>
        </div>
      </div>
    </Card>
  );
};

export default StatisticBox;
