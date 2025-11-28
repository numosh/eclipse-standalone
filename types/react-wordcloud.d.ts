declare module 'react-wordcloud' {
  import { ComponentType } from 'react'

  export interface Word {
    text: string
    value: number
  }

  export interface Options {
    colors?: string[]
    enableTooltip?: boolean
    deterministic?: boolean
    fontFamily?: string
    fontSizes?: [number, number]
    fontStyle?: string
    fontWeight?: string | number
    padding?: number
    rotations?: number
    rotationAngles?: [number, number]
    scale?: 'linear' | 'sqrt' | 'log'
    spiral?: 'archimedean' | 'rectangular'
    transitionDuration?: number
  }

  export interface Callbacks {
    getWordColor?: (word: Word) => string
    getWordTooltip?: (word: Word) => string
    onWordClick?: (word: Word) => void
    onWordMouseOver?: (word: Word) => void
    onWordMouseOut?: (word: Word) => void
  }

  export interface ReactWordcloudProps {
    words: Word[]
    options?: Options
    callbacks?: Callbacks
    maxWords?: number
    minSize?: [number, number]
    size?: [number, number]
  }

  const ReactWordcloud: ComponentType<ReactWordcloudProps>
  export default ReactWordcloud
}
