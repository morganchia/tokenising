import { Chart } from "react-google-charts";
export const data1 = [
    [
      "Month",
      "Campaigns Created",
      "Campaigns Withdrawn",
      "Recipient Created",
    ],
    ["2023/01", 2, 0, 5, ],
    ["2023/02", 3, 0, 2, ],
    ["2023/03", 4, 0, 4, ],
    ["2023/04", 3, 0, 3, ],
    ["2023/05", 2, 0, 3, ],
  ];
  
  export const options1 = {
    title: "Admin activities",
    vAxis: { title: "Transaction Count" },
    hAxis: { title: "Month" },
    seriesType: "bars",
  };

  export const data2 = [
    [
      "Month",
      "Minted",
      "Transferred",
      "Average",
    ],
    ["2023/01", 5, 2, 3.5],
    ["2023/02", 7, 3, 5],
    ["2023/03", 6, 6, 6],
    ["2023/04", 5, 5, 5],
    ["2023/05", 4, 2, 6],
  ];
  
  export const options2 = {
    title: "Mint / Transfer Transactions",
    vAxis: { title: "Transaction Count" },
    hAxis: { title: "Month" },
    seriesType: "bars",
    series: { 2: { type: "line" } },
  };

const charts = () => {
  return (
    <>
        <Chart
            chartType="ComboChart"
            width="100%"
            height="400px"
            data={data1}
            options={options1}
            loader={<div>Loading Chart...</div>}                
        />

        <Chart
            chartType="ComboChart"
            width="100%"
            height="400px"
            data={data2}
            options={options2}
            loader={<div>Loading Chart...</div>}                
        />
    </>
  )
}
export default charts
