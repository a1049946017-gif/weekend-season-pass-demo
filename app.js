const tiers=[
  {id:"gold68",name:"曜金季卡",price:68,resource:"gold",resourceName:"金砖",immediate:680,weekend:260,total:4060,multiple:"5.97"},
  {id:"gold38",name:"惠金季卡",price:38,resource:"gold",resourceName:"金砖",immediate:380,weekend:120,total:1940,multiple:"5.11"},
  {id:"energy28",name:"充能季卡",price:28,resource:"energy",resourceName:"体力",immediate:500,weekend:120,total:2060,multiple:"7.36"}
];

const weekends=[
  ["2027-02-06","2027-02-07"],["2027-02-13","2027-02-14"],["2027-02-20","2027-02-21"],
  ["2027-02-27","2027-02-28"],["2027-03-06","2027-03-07"],["2027-03-13","2027-03-14"],
  ["2027-03-20","2027-03-21"],["2027-03-27","2027-03-28"],["2027-04-03","2027-04-04"],
  ["2027-04-10","2027-04-11"],["2027-04-17","2027-04-18"],["2027-04-24","2027-04-25"],
  ["2027-05-01","2027-05-02"]
].map((dates,index)=>({index,start:dates[0],end:dates[1]}));

function formatDate(dateString){const[,month,day]=dateString.split("-");return`${Number(month)}月${Number(day)}日`}
const demoMoments=[
  {value:"2027-01-14",label:"1月14日｜活动首日"},{value:"2027-02-05",label:"2月5日｜购买截止日"},
  ...weekends.map((week,index)=>({value:week.start,label:`${formatDate(week.start)}｜第${index+1}周末`})),
  {value:"2027-05-07",label:"5月7日｜活动已结束"}
];

const state={selectedTierId:tiers[0].id,currentDate:"2027-01-14",purchased:new Set(),claimed:Object.fromEntries(weekends.map(week=>[week.index,new Set()])),wallet:{gold:1030,energy:220}};
const $=id=>document.getElementById(id);
const entryScreen=$("entryScreen"),passScreen=$("passScreen"),tierSwitcher=$("tierSwitcher"),heroReward=$("heroReward"),buyButton=$("buyButton"),tierSummary=$("tierSummary"),weekList=$("weekList"),claimAllButton=$("claimAllButton"),timeSelect=$("timeSelect"),rulesModal=$("rulesModal"),toast=$("toast");

function resourceIcon(resource){return`<span class="mini-resource ${resource==="energy"?"energy":""}"></span>`}
function selectedTier(){return tiers.find(tier=>tier.id===state.selectedTierId)}
function isSaleOpen(){return state.currentDate>="2027-01-14"&&state.currentDate<="2027-02-05"}
function currentWeekend(){return weekends.find(week=>state.currentDate>=week.start&&state.currentDate<=week.end)}

function renderTimeOptions(){timeSelect.innerHTML=demoMoments.map(moment=>`<option value="${moment.value}">${moment.label}</option>`).join("");timeSelect.value=state.currentDate}

function renderTierTabs(){
  tierSwitcher.innerHTML=tiers.map(tier=>`<button class="tier-tab ${tier.id===state.selectedTierId?"active":""} ${state.purchased.has(tier.id)?"purchased":""}" type="button" data-tier="${tier.id}"><span class="tier-price">¥${tier.price}</span><span class="tier-name">${tier.name}</span></button>`).join("");
  tierSwitcher.querySelectorAll("[data-tier]").forEach(button=>button.addEventListener("click",()=>{state.selectedTierId=button.dataset.tier;render()}));
}

function renderHero(){
  const tier=selectedTier(),purchased=state.purchased.has(tier.id);
  heroReward.innerHTML=`购买立即获得 ${resourceIcon(tier.resource)} <strong>×${tier.immediate}</strong><br>13个周末累计再领 <strong>×${tier.weekend*13}</strong>`;
  if(purchased){buyButton.textContent="已购买";buyButton.disabled=true}
  else if(!isSaleOpen()){buyButton.textContent="已结束售卖";buyButton.disabled=true}
  else{buyButton.textContent=`¥${tier.price} 立即购买`;buyButton.disabled=false}
}

function renderSummary(){
  const tier=selectedTier(),cells=[["立即获得",`${tier.immediate}${tier.resourceName}`],["每周末",`${tier.weekend}${tier.resourceName}`],["总价值",`${tier.total}${tier.resourceName}`],["返利倍率",`${tier.multiple}倍`]];
  tierSummary.innerHTML=cells.map(([label,value])=>`<div class="summary-cell"><span class="summary-label">${label}</span><span class="summary-value">${value}</span></div>`).join("");
}

function weekStatus(week){
  const current=currentWeekend(),purchasedCount=state.purchased.size,claimedCount=state.claimed[week.index].size;
  if(current&&current.index===week.index){
    const availableCount=[...state.purchased].filter(tierId=>!state.claimed[week.index].has(tierId)).length;
    if(availableCount>0)return{label:`可领取×${availableCount}`,className:"available",rowClass:"current"};
    if(purchasedCount>0&&claimedCount===purchasedCount)return{label:"已领取",className:"done",rowClass:"claimed current"};
    return{label:"购买后可领",className:"future",rowClass:"current"};
  }
  if(state.currentDate>week.end){
    if(purchasedCount>0&&claimedCount===purchasedCount)return{label:"已领取",className:"done",rowClass:"claimed"};
    return{label:"已错过",className:"",rowClass:"missed"};
  }
  return{label:"未开启",className:"future",rowClass:""};
}

function renderWeekList(){
  weekList.innerHTML=weekends.map(week=>{
    const status=weekStatus(week);
    const rewardLabels=tiers.map(tier=>{const ownership=state.purchased.has(tier.id)?"":" · 未购",claimed=state.claimed[week.index].has(tier.id)?" · 已领":"";return`<span class="reward-chip">${resourceIcon(tier.resource)}${tier.weekend}${tier.resourceName}${ownership}${claimed}</span>`}).join("");
    return`<div class="week-row ${status.rowClass}" data-week="${week.index}"><div class="week-date"><strong>${formatDate(week.start)}—${formatDate(week.end)}</strong><span>第 ${String(week.index+1).padStart(2,"0")} 个周末</span></div><div class="week-rewards">${rewardLabels}</div><div class="status-pill ${status.className}">${status.label}</div></div>`;
  }).join("");
  const current=currentWeekend();if(current)requestAnimationFrame(()=>weekList.querySelector(`[data-week="${current.index}"]`)?.scrollIntoView({block:"center",behavior:"smooth"}));
}

function renderClaimButton(){
  const current=currentWeekend();
  if(!current){claimAllButton.textContent=state.currentDate<weekends[0].start?"首个领取周末：2月6日—2月7日":"活动领取期已结束";claimAllButton.disabled=true;return}
  const availableTiers=[...state.purchased].filter(tierId=>!state.claimed[current.index].has(tierId));
  if(!availableTiers.length){claimAllButton.textContent=state.purchased.size===0?"购买任一档位后，本周登录可领取":"本周奖励已全部领取";claimAllButton.disabled=true;return}
  const rewardText=availableTiers.map(tierId=>{const tier=tiers.find(item=>item.id===tierId);return`${tier.weekend}${tier.resourceName}`}).join(" + ");
  claimAllButton.textContent=`领取本周奖励：${rewardText}`;claimAllButton.disabled=false;
}

function renderWallet(){$("goldWallet").textContent=state.wallet.gold;$("energyWallet").textContent=state.wallet.energy}
function render(){renderTierTabs();renderHero();renderSummary();renderWeekList();renderClaimButton();renderWallet()}
let toastTimer;function showToast(message){clearTimeout(toastTimer);toast.textContent=message;toast.classList.add("show");toastTimer=setTimeout(()=>toast.classList.remove("show"),2300)}

$("entryButton").addEventListener("click",()=>{entryScreen.classList.remove("active");passScreen.classList.add("active");render()});
$("backButton").addEventListener("click",()=>{passScreen.classList.remove("active");entryScreen.classList.add("active")});
buyButton.addEventListener("click",()=>{const tier=selectedTier();if(!isSaleOpen()||state.purchased.has(tier.id))return;state.purchased.add(tier.id);state.wallet[tier.resource]+=tier.immediate;showToast(`购买${tier.name}成功，立即获得${tier.immediate}${tier.resourceName}`);render()});
claimAllButton.addEventListener("click",()=>{const current=currentWeekend();if(!current)return;const availableTiers=[...state.purchased].filter(tierId=>!state.claimed[current.index].has(tierId));if(!availableTiers.length)return;const rewards=[];availableTiers.forEach(tierId=>{const tier=tiers.find(item=>item.id===tierId);state.claimed[current.index].add(tierId);state.wallet[tier.resource]+=tier.weekend;rewards.push(`${tier.weekend}${tier.resourceName}`)});showToast(`领取成功：${rewards.join(" + ")}`);render()});
timeSelect.addEventListener("change",event=>{state.currentDate=event.target.value;render();showToast(`原型时间已切换至 ${formatDate(state.currentDate)}`)});
$("rulesButton").addEventListener("click",()=>rulesModal.classList.add("open"));
$("modalClose").addEventListener("click",()=>rulesModal.classList.remove("open"));
rulesModal.addEventListener("click",event=>{if(event.target===rulesModal)rulesModal.classList.remove("open")});
document.addEventListener("keydown",event=>{if(event.key==="Escape")rulesModal.classList.remove("open")});

renderTimeOptions();render();
