const tiers=[
  {id:"gold68",name:"曜金季卡",price:68,resource:"gold",resourceName:"金砖",immediate:680,weekend:360,total:5720,returnTag:"超800%返利"},
  {id:"gold38",name:"惠金季卡",price:38,resource:"gold",resourceName:"金砖",immediate:380,weekend:120,total:2060,returnTag:"超500%返利"},
  {id:"energy28",name:"充能季卡",price:28,resource:"energy",resourceName:"体力",immediate:500,weekend:120,total:2180,returnTag:"超700%返利"}
];

const weekends=[
  ["2027-02-06T05:00","2027-02-07","2027-02-08T05:00"],["2027-02-13T05:00","2027-02-14","2027-02-15T05:00"],["2027-02-20T05:00","2027-02-21","2027-02-22T05:00"],
  ["2027-02-27T05:00","2027-02-28","2027-03-01T05:00"],["2027-03-06T05:00","2027-03-07","2027-03-08T05:00"],["2027-03-13T05:00","2027-03-14","2027-03-15T05:00"],
  ["2027-03-20T05:00","2027-03-21","2027-03-22T05:00"],["2027-03-27T05:00","2027-03-28","2027-03-29T05:00"],["2027-04-03T05:00","2027-04-04","2027-04-05T05:00"],
  ["2027-04-10T05:00","2027-04-11","2027-04-12T05:00"],["2027-04-17T05:00","2027-04-18","2027-04-19T05:00"],["2027-04-24T05:00","2027-04-25","2027-04-26T05:00"],
  ["2027-05-01T05:00","2027-05-02","2027-05-03T05:00"],["2027-05-08T05:00","2027-05-09","2027-05-10T05:00"]
].map((dates,index)=>({index,start:dates[0],sunday:dates[1],end:dates[2]}));

function formatDate(dateString){const datePart=dateString.split("T")[0];const[,month,day]=datePart.split("-");return`${Number(month)}月${Number(day)}日`}
const demoMoments=[
  {value:"2027-01-14T05:00",label:"1月14日05:00｜购买期开始"},{value:"2027-02-06T04:59",label:"2月6日04:59｜购买期末"},
  ...weekends.map((week,index)=>({value:week.start,label:`${formatDate(week.start)}｜第${index+1}周末`})),
  {value:"2027-05-10T05:00",label:"5月10日05:00｜领取期结束"}
];

const state={selectedTierId:tiers[0].id,currentDate:"2027-01-14T05:00",purchased:new Set(),claimed:Object.fromEntries(weekends.map(week=>[week.index,new Set()])),wallet:{gold:1030,energy:220}};
const $=id=>document.getElementById(id);
const tierSwitcher=$("tierSwitcher"),heroReward=$("heroReward"),buyButton=$("buyButton"),tierSummary=$("tierSummary"),weekList=$("weekList"),claimAllButton=$("claimAllButton"),timeSelect=$("timeSelect"),rulesModal=$("rulesModal"),toast=$("toast");

function resourceIcon(resource){return`<span class="mini-resource ${resource==="energy"?"energy":""}"></span>`}
function selectedTier(){return tiers.find(tier=>tier.id===state.selectedTierId)}
function isSaleOpen(){return state.currentDate>="2027-01-14T05:00"&&state.currentDate<"2027-02-06T05:00"}
function currentWeekend(){return weekends.find(week=>state.currentDate>=week.start&&state.currentDate<week.end)}

function renderTimeOptions(){timeSelect.innerHTML=demoMoments.map(moment=>`<option value="${moment.value}">${moment.label}</option>`).join("");timeSelect.value=state.currentDate}

function renderTierTabs(){
  tierSwitcher.innerHTML=tiers.map(tier=>`<button class="tier-tab ${tier.id===state.selectedTierId?"active":""} ${state.purchased.has(tier.id)?"purchased":""}" type="button" data-tier="${tier.id}"><span class="return-tag"><strong>${tier.returnTag}</strong></span><span class="tier-price">¥${tier.price}</span><span class="tier-name">${tier.name}</span></button>`).join("");
  tierSwitcher.querySelectorAll("[data-tier]").forEach(button=>button.addEventListener("click",()=>{state.selectedTierId=button.dataset.tier;render()}));
}

function renderHero(){
  const tier=selectedTier(),purchased=state.purchased.has(tier.id);
  heroReward.innerHTML=`购买立即获得 ${resourceIcon(tier.resource)} <strong>×${tier.immediate}</strong><br>14个周末累计再领 <strong>×${tier.weekend*14}</strong>`;
  if(purchased){buyButton.textContent="已购买";buyButton.disabled=true}
  else if(!isSaleOpen()){buyButton.textContent="已结束售卖";buyButton.disabled=true}
  else{buyButton.textContent=`¥${tier.price} 立即购买`;buyButton.disabled=false}
}

function renderSummary(){
  const tier=selectedTier(),cells=[["立即获得",`${tier.immediate}${tier.resourceName}`],["每周末",`${tier.weekend}${tier.resourceName}`],["总价值",`${tier.total}${tier.resourceName}`]];
  tierSummary.innerHTML=cells.map(([label,value])=>`<div class="summary-cell"><span class="summary-label">${label}</span><span class="summary-value">${value}</span></div>`).join("");
}

function weekStatus(week){
  const current=currentWeekend(),tier=selectedTier(),purchased=state.purchased.has(tier.id),claimed=state.claimed[week.index].has(tier.id);
  if(current&&current.index===week.index){
    if(purchased&&!claimed)return{label:"可领取",className:"available",rowClass:"current"};
    if(purchased&&claimed)return{label:"已领取",className:"done",rowClass:"claimed current"};
    return{label:"购买后可领",className:"future",rowClass:"current"};
  }
  if(state.currentDate>=week.end){
    if(claimed)return{label:"已领取",className:"done",rowClass:"claimed"};
    return{label:"已错过",className:"",rowClass:"missed"};
  }
  return{label:"未开启",className:"future",rowClass:""};
}

function renderWeekList(){
  weekList.innerHTML=weekends.map(week=>{
    const status=weekStatus(week),tier=selectedTier(),ownership=state.purchased.has(tier.id)?"":" · 未购",claimed=state.claimed[week.index].has(tier.id)?" · 已领":"";
    const rewardLabel=`<span class="reward-chip">${resourceIcon(tier.resource)}${tier.weekend}${tier.resourceName}${ownership}${claimed}</span>`;
    return`<div class="week-row ${status.rowClass}" data-week="${week.index}"><div class="week-date"><strong>${formatDate(week.start)}—${formatDate(week.sunday)}</strong><span>周六05:00—周一05:00</span></div><div class="week-rewards">${rewardLabel}</div><div class="status-pill ${status.className}">${status.label}</div></div>`;
  }).join("");
  const current=currentWeekend();if(current)requestAnimationFrame(()=>weekList.querySelector(`[data-week="${current.index}"]`)?.scrollIntoView({block:"center",behavior:"smooth"}));
}

function renderClaimButton(){
  const current=currentWeekend();
  if(!current){claimAllButton.textContent=state.currentDate<weekends[0].start?"首个领取窗口：2月6日05:00—2月8日05:00":"活动领取期已结束";claimAllButton.disabled=true;return}
  const tier=selectedTier();
  if(!state.purchased.has(tier.id)){claimAllButton.textContent=`购买${tier.name}后，本周登录可领取`;claimAllButton.disabled=true;return}
  if(state.claimed[current.index].has(tier.id)){claimAllButton.textContent="本周奖励已领取";claimAllButton.disabled=true;return}
  claimAllButton.textContent=`领取本周奖励：${tier.weekend}${tier.resourceName}`;claimAllButton.disabled=false;
}

function renderWallet(){$("goldWallet").textContent=state.wallet.gold;$("energyWallet").textContent=state.wallet.energy}
function render(){renderTierTabs();renderHero();renderSummary();renderWeekList();renderClaimButton();renderWallet()}
let toastTimer;function showToast(message){clearTimeout(toastTimer);toast.textContent=message;toast.classList.add("show");toastTimer=setTimeout(()=>toast.classList.remove("show"),2300)}

buyButton.addEventListener("click",()=>{const tier=selectedTier();if(!isSaleOpen()||state.purchased.has(tier.id))return;state.purchased.add(tier.id);state.wallet[tier.resource]+=tier.immediate;showToast(`购买${tier.name}成功，立即获得${tier.immediate}${tier.resourceName}`);render()});
claimAllButton.addEventListener("click",()=>{const current=currentWeekend(),tier=selectedTier();if(!current||!state.purchased.has(tier.id)||state.claimed[current.index].has(tier.id))return;state.claimed[current.index].add(tier.id);state.wallet[tier.resource]+=tier.weekend;showToast(`领取成功：${tier.weekend}${tier.resourceName}`);render()});
timeSelect.addEventListener("change",event=>{state.currentDate=event.target.value;render();showToast(`原型时间已切换至 ${formatDate(state.currentDate)}`)});
$("rulesButton").addEventListener("click",()=>rulesModal.classList.add("open"));
$("modalClose").addEventListener("click",()=>rulesModal.classList.remove("open"));
rulesModal.addEventListener("click",event=>{if(event.target===rulesModal)rulesModal.classList.remove("open")});
document.addEventListener("keydown",event=>{if(event.key==="Escape")rulesModal.classList.remove("open")});

renderTimeOptions();render();
