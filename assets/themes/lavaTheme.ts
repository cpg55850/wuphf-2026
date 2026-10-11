import { lighten, desaturate, mix } from 'polished'

const bodyColor = '#000'
const primaryColor = '#FE7900'
const likeColor = '#03B97C'
const commentColor = 'magenta'

export const lavaTheme = {
  colors: {
    header: 'orange',
    footer: 'cyan',
    white: '#483C33',
    lightBlue: '#CF121F',
    grey: '#FFD228',
    darkBlue: '#F83A0C',
    darkestBlue: '#FFD228',

    //

    primary: primaryColor,
    body: bodyColor,
    border: lighten(0.2, desaturate(0.1, bodyColor)),
    highlight: lighten(0.1, desaturate(0.1, bodyColor)),
    highlightPressed: lighten(0.17, desaturate(0.1, bodyColor)),
    text: '#fff',
    subtext: lighten(0.5, desaturate(0.5, bodyColor)),
    hamburger: lighten(0.11, desaturate(0.1, bodyColor)),
    hamburgerLine: lighten(0.51, desaturate(0.1, bodyColor)),
    like: likeColor,
    likeHover: mix(0.8, bodyColor, likeColor),
    likeActive: mix(0.5, bodyColor, likeColor),
    comment: commentColor,
    commentHover: mix(0.8, bodyColor, commentColor),
    commentActive: mix(0.5, bodyColor, commentColor),
  },
  button: {
    primary: {
      bg: primaryColor,
      text: '#fff',
    },
    secondary: {
      bg: primaryColor,
      text: '#f4f4f3',
    },
  },
}
