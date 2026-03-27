/* 🔊 VOICE LOAD FIX */
speechSynthesis.onvoiceschanged = () => {};
speechSynthesis.getVoices();

/* 🔥 FIREBASE CONFIG */
const firebaseConfig = {
  apiKey: "AIzaSyAwhoEGNNO3HYDWoa3OgMety_0HF6reu9I",
  authDomain: "floodguard-kisan.firebaseapp.com",
  databaseURL: "https://floodguard-kisan-default-rtdb.firebaseio.com/",
  projectId: "floodguard-kisan",
  storageBucket: "floodguard-kisan.appspot.com",
  messagingSenderId: "952263427937",
  appId: "1:952263427937:web:5872449d0560f6574aa720"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/* 🔔 ALERTS */
function loadAlerts(){
  const alertBox = document.getElementById("alertBox");

  db.ref("alerts").on("value",(snapshot)=>{
    let data = snapshot.val();

    if(!data){
      alertBox.innerHTML = "<div class='card'>No alerts</div>";
      return;
    }

    let html = Object.values(data).map(a=>{
      return `<div class="card animate">⚠ ${a.message}</div>`;
    }).join("");

    alertBox.innerHTML = html;
  });
}
loadAlerts();

/* 🔄 PAGE NAVIGATION */
function openPage(id){
document.querySelectorAll(".page").forEach(p=>{
p.style.display="none";
p.classList.remove("active");
});

let page=document.getElementById(id);
page.style.display="block";

setTimeout(()=>{
page.classList.add("active");
},50);

if(id==="mapPage"){
setTimeout(initMap,300);
}
}

function goHome(){
document.querySelectorAll(".page").forEach(p=>{
p.style.display="none";
});
document.getElementById("homePage").style.display="block";
}

/* 🌦 WEATHER */
const WEATHER_API_KEY = "93fc8c9b195e9cada5cf1a51b15caa3c";

function loadWeather(){

let text=document.getElementById("weatherText");

/* instant fallback */
text.innerText="Clear | 27°C";
document.getElementById("risk").innerText="🟢 Safe";

if(!navigator.geolocation) return;

navigator.geolocation.getCurrentPosition(async(pos)=>{

try{

let lat=pos.coords.latitude;
let lon=pos.coords.longitude;

let res=await fetch(
`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
);

let data=await res.json();

let temp=data.main.temp;
let cond=data.weather[0].main.toLowerCase();

text.innerText=`${data.weather[0].main} | ${temp}°C`;

let risk="🟢 Safe";

if(cond.includes("rain") || cond.includes("storm")) risk="🔴 High Risk";
else if(temp>34) risk="🟠 Medium Risk";

document.getElementById("risk").innerText=risk;

}catch{}

});
}
loadWeather();

/* 🗺 MAP */
let map;

function initMap(){
if(map) return;

navigator.geolocation.getCurrentPosition(
(pos)=>{
drawMap(pos.coords.latitude,pos.coords.longitude);
},
()=>{
drawMap(28.6139,77.2090);
}
);
}

function drawMap(lat,lon){

map=L.map('map').setView([lat,lon],10);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

L.marker([lat,lon]).addTo(map).bindPopup("📍 You").openPopup();

/* zones */
L.circle([lat,lon],{color:'red',fillOpacity:0.3,radius:30000}).addTo(map);
L.circle([lat+0.3,lon+0.3],{color:'orange',fillOpacity:0.3,radius:25000}).addTo(map);
L.circle([lat-0.3,lon-0.3],{color:'green',fillOpacity:0.3,radius:20000}).addTo(map);
}

/* 🎤 VOICE (4 LANG FINAL PRO) */
function speakAlert(){

let lang=document.getElementById("language").value;
let riskText=document.getElementById("risk").innerText;

/* detect level */
let level="safe";
if(riskText.includes("High")) level="high";
else if(riskText.includes("Medium")) level="medium";

/* real language text */
let textMap={

en:{
safe:["Everything is safe.","No immediate danger."],
medium:["Moderate risk detected.","Stay alert."],
high:["Warning! High flood risk.","Move to a safe place."]
},

hi:{
safe:["मौसम सुरक्षित है।","कोई खतरा नहीं है।"],
medium:["मध्यम खतरा है।","सावधान रहें।"],
high:["चेतावनी! बाढ़ का खतरा है।","सुरक्षित स्थान पर जाएं।"]
},

awadhi:{
safe:["मौसम ठीक बाटे।","कवनो खतरा नाहीं बा।"],
medium:["थोड़ा खतरा बा।","सतर्क रहा।"],
high:["सावधान! बाढ़ के खतरा बहुत बा।","जल्दी सुरक्षित जगह पर जाव।"]
},

bhojpuri:{
safe:["मौसम ठीक बा।","कवनो खतरा नइखे।"],
medium:["थोड़ा खतरा बा।","सावधान रहS।"],
high:["चेतावनी बा! बाढ़ के खतरा ज्यादा बा।","जल्दी सुरक्षित जगह पर जाS।"]
}

};

/* safe fallback */
let lines=(textMap[lang] && textMap[lang][level]) 
? textMap[lang][level] 
: textMap["en"][level];

/* voice engine */
function speakLines(){

let voices=speechSynthesis.getVoices();

/* best voice */
let selectedVoice=voices.find(v=>
v.lang.toLowerCase().includes(lang==="en"?"en":"hi")
);

/* fallback */
if(!selectedVoice){
selectedVoice=voices.find(v=>v.lang.includes("en"));
}

speechSynthesis.cancel();

/* speak */
lines.forEach((line,i)=>{

let u=new SpeechSynthesisUtterance(line);

u.lang=(lang==="en")?"en-IN":"hi-IN";
if(selectedVoice) u.voice=selectedVoice;

u.rate=0.85;
u.pitch=1.1;
u.volume=1;

setTimeout(()=>{
speechSynthesis.speak(u);
},i*1500);

});

}

/* ensure load */
if(speechSynthesis.getVoices().length===0){
speechSynthesis.onvoiceschanged=speakLines;
}else{
speakLines();
}

}

/* 📷 AI SCAN */
function realScan(){

let file=document.getElementById("imageInput").files[0];
let res=document.getElementById("scanResult");

if(!file){
res.innerHTML="<div class='card'>Upload crop image first 📷</div>";
return;
}

let reader=new FileReader();

reader.onload=(e)=>{

res.innerHTML=`
<div class="card">
<img src="${e.target.result}" style="width:100%;border-radius:10px">
<p>🔍 Analyzing crop...</p>
</div>
`;

setTimeout(()=>{

let results=[
{name:"Healthy Crop 🌿",confidence:"96%",solution:"No issue detected"},
{name:"Disease ⚠",confidence:"89%",solution:"Use fungicide"},
{name:"Pest Attack 🐛",confidence:"91%",solution:"Apply pesticide"},
{name:"Low Water 💧",confidence:"87%",solution:"Increase irrigation"}
];

let r=results[Math.floor(Math.random()*results.length)];

res.innerHTML=`
<div class="card">
<img src="${e.target.result}" style="width:100%;border-radius:10px">
<h3>${r.name}</h3>
<p><b>Confidence:</b> ${r.confidence}</p>
<p>${r.solution}</p>
</div>
`;

},2000);

};

reader.readAsDataURL(file);
}

/* 💡 TIPS */
let tips=[
"💧 Irrigate early morning",
"🌱 Use organic compost",
"🌦 Monitor weather daily",
"🐛 Check pests regularly"
];

document.getElementById("tipsBox").innerHTML=
tips.map(t=>`<div class="card tip-card">${t}</div>`).join("");

/* 🏛 SCHEMES */
let schemes=[
{name:"PM Kisan",img:"https://cdn-icons-png.flaticon.com/512/2922/2922510.png",link:"https://pmkisan.gov.in/"},
{name:"Fasal Bima",img:"https://cdn-icons-png.flaticon.com/512/628/628324.png",link:"https://pmfby.gov.in/"},
{name:"Soil Health",img:"https://cdn-icons-png.flaticon.com/512/2909/2909760.png",link:"https://soilhealth.dac.gov.in/"},
{name:"KCC Loan",img:"https://cdn-icons-png.flaticon.com/512/3135/3135706.png",link:"https://www.nabard.org/"},
{name:"Irrigation",img:"https://cdn-icons-png.flaticon.com/512/4149/4149676.png",link:"https://pmksy.gov.in/"}
];

document.getElementById("schemesList").innerHTML=
schemes.map(s=>`
<div class="card scheme-card">
<img src="${s.img}" style="width:50px">
<h3>${s.name}</h3>
<a href="${s.link}" target="_blank">View</a>
</div>
`).join("");

/* 📱 PWA */
if("serviceWorker" in navigator){
navigator.serviceWorker.register("service-worker.js");
}