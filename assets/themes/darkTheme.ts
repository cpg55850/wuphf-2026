import { lighten, desaturate, mix } from 'polished'

const bodyColor = '#15202B'
const likeColor = '#03B97C'
const commentColor = 'magenta'

export const darkTheme = {
  colors: {
    header: '#2b2b0a',
    footer: 'cyan',
    white: '#202020',
    lightBlue: lighten(0.05, desaturate(0.1, bodyColor)),
    grey: '#FFD228',
    darkBlue: '#F83A0C',
    darkestBlue: '#Adad1c',

    //

    primary: '#1F9BEF',
    body: bodyColor,
    border: lighten(0.2, desaturate(0.1, bodyColor)),
    highlight: lighten(0.05, desaturate(0.1, bodyColor)),
    highlightPressed: lighten(0.1, desaturate(0.1, bodyColor)),
    text: '#fff',
    subtext: lighten(0.5, desaturate(0.5, bodyColor)),
    like: '#03B97C',
    hamburger: lighten(0.11, desaturate(0.1, bodyColor)),
    hamburgerLine: lighten(0.51, desaturate(0.1, bodyColor)),
    // like: likeColor,
    likeHover: mix(0.8, bodyColor, likeColor),
    likeActive: mix(0.5, bodyColor, likeColor),
    comment: commentColor,
    commentHover: mix(0.8, bodyColor, commentColor),
    commentActive: mix(0.5, bodyColor, commentColor),
  },
  button: {
    primary: {
      bg: '#1F9BEF',
      text: '#fff',
    },
    secondary: {
      bg: '#243546',
      text: '#fff',
    },
  },
}
