import gsap from "https://cdn.skypack.dev/gsap@3.12.0";
import { ScrollTrigger } from "https://cdn.skypack.dev/gsap@3.12.0/ScrollTrigger";

if (!CSS.supports("animation-timeline: scroll()")) {
  gsap.registerPlugin(ScrollTrigger);
  console.clear();
  const scrub = 0.2;
  const name = document.querySelector("section:nth-of-type(1) svg");
  gsap
    .timeline()
    .to(name, {
      scrollTrigger: {
        invalidateOnRefresh: true,
        trigger: name.parentNode,
        scrub,
        start: "top top",
        end: "bottom top-=25%",
      },
      opacity: 1,
    });

  const p = document.querySelector("section:nth-of-type(2) p");
  gsap
    .timeline()
    .to(p, {
      opacity: 1,
      immediateRender: false,
      scrollTrigger: {
        trigger: p.parentNode.parentNode,
        scrub,
        start: "top bottom",
        end: "top 50%",
      },
    })
    .to(p, {
      opacity: 0,
      immediateRender: false,
      scrollTrigger: {
        trigger: p.parentNode.parentNode,
        scrub,
        start: "bottom bottom",
        end: "bottom 50%",
      },
    });
}

