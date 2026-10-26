/* Progressive enhancement: content stays visible without JavaScript/observer support. */
(()=>{
 const preference=matchMedia('(prefers-reduced-motion: reduce)');
 const seen=new WeakSet();
 const finish=element=>{element.classList.remove('isaw-motion-pending','isaw-motion-enter');observer?.unobserve(element)};
 const enter=element=>{
  observer?.unobserve(element);element.classList.remove('isaw-motion-pending');
  if(preference.matches)return;
  element.classList.add('isaw-motion-enter');
  element.addEventListener('animationend',event=>{if(event.target===element)element.classList.remove('isaw-motion-enter')},{once:true});
 };
 const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>{
  entries.forEach(entry=>{if(entry.isIntersecting)enter(entry.target)})
 },{threshold:0,rootMargin:'0px 0px -24px 0px'}):null;
 const observe=(root=document)=>{
  root.querySelectorAll('[data-isaw-reveal]').forEach(element=>{
   if(seen.has(element))return;seen.add(element);
   if(preference.matches||!observer)return;
   element.classList.add('isaw-motion-pending');observer.observe(element);
  });
 };
 const revealAll=()=>document.querySelectorAll('.isaw-motion-pending,.isaw-motion-enter').forEach(finish);
 preference.addEventListener('change',()=>{if(preference.matches)revealAll()});
 document.addEventListener('focusin',event=>{const element=event.target.closest('[data-isaw-reveal]');if(element)finish(element)});
 window.addEventListener('pageshow',event=>{if(event.persisted)revealAll()});
 window.IsawMotion={observe};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>observe(),{once:true});else observe();
})();
