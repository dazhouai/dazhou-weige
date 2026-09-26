const filterButtons = [...document.querySelectorAll('[data-filter]')];
const cards = [...document.querySelectorAll('#project-list .project-card')];
const search = document.querySelector('#search');
const query = new URLSearchParams(location.search);
let selected = filterButtons.some(b=>b.dataset.filter===query.get('category')) ? query.get('category') : '全部';
search.value = query.get('q') || '';
function filterProjects(updateURL = true) {
  const keyword = search.value.trim().toLocaleLowerCase();
  let count = 0;
  cards.forEach(card => {
    const show = (selected === '全部' || selected === card.dataset.category) && card.dataset.search.includes(keyword);
    card.hidden = !show;
    if (show) count++;
  });
  filterButtons.forEach(button => {
    const active = button.dataset.filter === selected;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  document.querySelector('#empty-state').hidden = count > 0;
  document.querySelector('#result-count').textContent = `找到 ${count} 个项目`;
  if (updateURL) {
    const url = new URL(location.href);
    keyword ? url.searchParams.set('q', search.value) : url.searchParams.delete('q');
    selected !== '全部' ? url.searchParams.set('category', selected) : url.searchParams.delete('category');
    history.replaceState(null, '', url);
  }
}
filterButtons.forEach(b=>b.addEventListener('click',()=>{selected=b.dataset.filter;filterProjects();}));
search.addEventListener('input',()=>filterProjects());
document.querySelector('#clear-search').addEventListener('click',()=>{selected='全部';search.value='';filterProjects();search.focus();});
filterProjects(false);
window.addEventListener('popstate',()=>{
  const q = new URLSearchParams(location.search);
  selected = filterButtons.some(b=>b.dataset.filter===q.get('category')) ? q.get('category') : '全部';
  search.value=q.get('q')||'';filterProjects(false);
});
let revision = document.body.dataset.revision;
async function checkUpdates(){
  if(document.hidden) return;
  try {
    const response=await fetch('/projects.json',{cache:'no-store'});
    if(!response.ok) return;
    const data=await response.json();
    if(revision && revision!==data.revision) document.querySelector('#refresh-notice').hidden=false;
    revision ??= data.revision;
  } catch { /* Keep the readable static page available when offline. */ }
}
checkUpdates();
setInterval(checkUpdates,15000);
document.querySelector('#refresh-page').addEventListener('click',()=>location.reload());
