/* Shared footer interactions; all destinations work as normal links too. */
(()=>{
 const footer=document.querySelector('.isaw-footer');if(!footer)return;
 const top=footer.querySelector('[data-footer-top]');
 top?.addEventListener('click',event=>{event.preventDefault();const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;window.scrollTo({top:0,behavior:reduced?'auto':'smooth'});const heading=document.querySelector('header a, header button');heading?.focus({preventScroll:true})});
 const story=footer.querySelector('[data-footer-story]');
 story?.addEventListener('click',event=>{const target=new URL(story.href,location.href);const button=document.querySelector('#storyBtn');if(target.pathname===location.pathname&&button){event.preventDefault();button.click()}});
 const openStory=()=>{if(location.hash==='#our-story'){const button=document.querySelector('#storyBtn');if(button){button.click();history.replaceState(null,'',location.pathname+location.search)}}};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',openStory,{once:true});else openStory();
})();
