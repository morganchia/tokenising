import React from 'react';
//import * as FileSaver from "file-saver";
//import * as XLSX from 'sheetjs-style';
import AudittrailDataService from "../services/audittrail.service";

export const ExportToExcel = ({ startdate, enddate, excelfileName }) => {
  const fileType =
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
  const fileExtension = ".xlsx";
  var apiData1 = "";

  console.log("startdate=", startdate);
  console.log("enddate=", enddate);
  console.log("excelfileName=", excelfileName);
  
  const exportToExcel = () => {
/*
    AudittrailDataService.getdata(startdate, enddate)
    .then(response => {
      if (! response.data) {
        console.log("Error, no data from database query!");
      } else {       
        console.log("Database query result:", response.data)
        apiData1 = response.data;  
        
        const ws = XLSX.utils.json_to_sheet(apiData1);
        const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
        const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const data1 = new Blob([excelBuffer], { type: fileType });
        FileSaver.saveAs(data1, excelfileName + fileExtension);
    
      }
    })
    .catch(e => {
      console.log(e);
      //return(null);
    });

*/

  };

  return (
    <button onClick={(e) => exportToExcel(apiData1, excelfileName)} 
        className="m-3 btn btn-sm btn-primary"
    >
      &nbsp;Export&nbsp;
    </button>
  );
};
