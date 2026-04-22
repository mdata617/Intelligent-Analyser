let salesChart;
let predictionChart;

function toggleSidebar(){
const sidebar=document.getElementById("sidebar");
const main=document.getElementById("main");

if(window.innerWidth>768){
sidebar.classList.toggle("hide");
main.classList.toggle("full");
}else{
sidebar.classList.toggle("show");
}
}

function createCharts(labels=[], values=[]){

const ctx1=document.getElementById("salesChart");

if(salesChart) salesChart.destroy();

salesChart=new Chart(ctx1,{
type:"bar",
data:{
labels:labels,
datasets:[{
label:"Sales",
data:values,
borderRadius:12,
borderSkipped:false,
barThickness:32,
backgroundColor:[
"#2563eb",
"#3b82f6",
"#60a5fa",
"#93c5fd",
"#1d4ed8",
"#2563eb",
"#3b82f6",
"#60a5fa"
]
}]
},
options:{
responsive:true,
maintainAspectRatio:false,
plugins:{
legend:{display:false},
tooltip:{
backgroundColor:"#111827",
padding:12
}
},
scales:{
x:{
grid:{display:false},
ticks:{color:"#64748b"}
},
y:{
grid:{color:"#eef2f7"},
ticks:{color:"#64748b"}
}
}
}
});

const ctx2=document.getElementById("predictionChart");

if(predictionChart) predictionChart.destroy();

let predict = values.map(v => Math.round(v*1.1));

/* REPLACE predictionChart block */

predictionChart = new Chart(ctx2,{
type:"line",
data:{
labels:labels,
datasets:[{
label:"Forecast",
data:predict,
borderWidth:4,
tension:0.45,
fill:true,
pointRadius:5,
pointHoverRadius:7,
pointBackgroundColor:"#2563eb",
pointBorderWidth:3,
pointBorderColor:"#ffffff",
borderColor:"#2563eb",
backgroundColor:(context)=>{
const chart = context.chart;
const {ctx, chartArea} = chart;

if(!chartArea) return null;

const gradient = ctx.createLinearGradient(
0,
chartArea.top,
0,
chartArea.bottom
);

gradient.addColorStop(0,"rgba(37,99,235,0.28)");
gradient.addColorStop(1,"rgba(37,99,235,0.02)");

return gradient;
}
}]
},
options:{
responsive:true,
maintainAspectRatio:false,
plugins:{
legend:{display:false},
tooltip:{
backgroundColor:"#111827",
padding:12,
cornerRadius:10
}
},
scales:{
x:{
grid:{display:false},
ticks:{
color:"#64748b",
font:{weight:"600"}
}
},
y:{
grid:{color:"#eef2f7"},
ticks:{
color:"#64748b"
}
}
}
}
});

}

document.getElementById("fileInput").addEventListener("change", async function(){

const file=this.files[0];
if(!file) return;

document.getElementById("fileName").textContent="Uploading...";

const fd=new FormData();
fd.append("file",file);

const res=await fetch("/upload",{method:"POST",body:fd});
const data=await res.json();

if(data.error){
document.getElementById("fileName").textContent=data.error;
return;
}

document.getElementById("fileName").textContent=file.name;

/* KPI */
document.querySelectorAll(".kpi h2")[0].textContent="₹"+data.kpi.total_sales.toLocaleString();
document.querySelectorAll(".kpi h2")[1].textContent="₹"+data.kpi.avg_sales.toLocaleString();
document.querySelectorAll(".kpi h2")[2].textContent="₹"+data.kpi.forecast.toLocaleString();
document.querySelectorAll(".kpi h2")[3].textContent=data.kpi.orders;

/* Charts */
createCharts(data.monthly.labels, data.monthly.values);
/* CUSTOMER SEGMENT */

let hv = Math.max(1, Math.round(data.kpi.orders * 0.25));

document.getElementById("segmentText").textContent =
"High Value Customers: " + hv;

document.getElementById("segmentCircle").style.background =
`conic-gradient(#2563eb 0 ${hv*10}%, #e5e7eb ${hv*10}% 100%)`;


/* BUSINESS INSIGHTS */

const list = document.getElementById("insightList");
list.innerHTML = "";

let topCategory = "N/A";

if(data.categories){
topCategory = Object.keys(data.categories)[0];
}

list.innerHTML += `<li>Total Sales: ₹${data.kpi.total_sales.toLocaleString()}</li>`;
list.innerHTML += `<li>Top Category: ${topCategory}</li>`;
list.innerHTML += `<li>Forecast Next: ₹${data.kpi.forecast.toLocaleString()}</li>`;
list.innerHTML += `<li>Total Orders: ${data.kpi.orders}</li>`;

});

/* default chart */
createCharts(
["Jan","Feb","Mar","Apr","May"],
[12000,18000,15000,24000,28000]
);

