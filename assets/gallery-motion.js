// Only Gallery opts its shared footer into the content entrance.
const galleryFooter=document.querySelector('.isaw-footer');
if(galleryFooter){galleryFooter.setAttribute('data-isaw-reveal','');window.IsawMotion?.observe(document.querySelector('.isaw-footer-backdrop'))}
