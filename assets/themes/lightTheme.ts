import { darken, desaturate, mix } from 'polished'

const bodyColor = '#fff'
const likeColor = '#03B97C'
const commentColor = 'magenta'

export const lightTheme = {
  colors: {
    header: 'orange',
    footer: 'cyan',
    // white: '#f4f4f3',
    white: '#fff',
    lightBlue: '#72d0ed',
    grey: '#747378',
    darkBlue: '#7395b0',
    darkestBlue: '#202e4a',
    wuphfInputBackground: '#e3f6fb',

    //

    primary: '#1F9BEF',
    body: bodyColor,
    border: darken(0.2, desaturate(0.1, bodyColor)),
    highlight: darken(0.05, bodyColor),
    highlightPressed: darken(0.1, bodyColor),
    text: '#000',
    subtext: darken(0.5, desaturate(0.5, bodyColor)),
    hamburger: darken(0.11, desaturate(0.1, bodyColor)),
    hamburgerLine: darken(0.51, desaturate(0.1, bodyColor)),
    like: likeColor,
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
      bg: '#202e4a',
      text: '#f4f4f3',
    },
  },
}
