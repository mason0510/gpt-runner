import { motion } from 'framer-motion'
import styled from 'styled-components'
import { Icon } from '../icon'

export const TabContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`

export const TabListHeader = styled.div`
  flex-shrink: 0;
  position: relative;
  padding: calc(var(--border-width) * 3px) 1rem;

  &[data-show-more=true] {
    padding-right: 2rem;
  }
`

export const TabListWrapper = styled.div`
  display: flex;
  overflow-x: auto;
  position: relative;
  justify-content: space-evenly;

  &[data-show-more=true] {
    justify-content: flex-start;
  }

  /* hide scroll bar style */
  &::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;
`

export const TabItemWrapper = styled.div`
  flex: 1;
  display: flex;
`

export const TabItemLabel = styled.div`
  white-space: nowrap;
  flex: 1;
  padding: 0 var(--type-ramp-base-font-size);
  height: calc(var(--design-unit) * 7px);
  line-height: calc(var(--design-unit) * 7px);
  text-align: center;
  color: var(--panel-tab-foreground);
  font-size: var(--type-ramp-base-font-size);
  cursor: pointer;

  &.tab-item-active {
    color: var(--panel-tab-active-foreground);
  }
`

export const ActiveTabIndicator = styled(motion.div)`
  height: 1px;
  background-color: var(--panel-tab-active-foreground);
  position: absolute;
  left: 0;
  bottom: 0;
  transition: transform 0.2s ease-in-out;
`

export const MoreWrapper = styled.div`
  height: 100%;
  background-color: var(--panel-view-background);
  position: absolute;
  right: 0;
  top: 0;
  z-index: 2;
  display: flex;
  justify-content: center;
  align-items: center;
`

export const MoreIconWrapper = styled.div`
  display: inline-flex;
  justify-content: center;
  align-items: center;
  font-size: 1.2rem;
  width: 1.5rem;
  height: 1.5rem;
  margin: 0 0.25rem;
  border-radius: 0.25rem;
  overflow: hidden;
  cursor: pointer;

  &:hover {
    background: var(--panel-view-border);
  }
`

export const StyledMoreIcon = styled(Icon)`

`

export const MoreList = styled.div`
  min-width: var(--input-min-width);
  padding: 0.5rem;
  border: 1px solid var(--panel-view-border);
  position: absolute;
  z-index: 3;
  /* top: 33px; */
  top: calc(var(--design-unit) * 7px + var(--border-width) * 3px);
  right: 2px;
  background-color: var(--panel-view-background);
  box-shadow: 0 6px 16px 0 rgba(0, 0, 0, .08), 0 3px 6px -4px rgba(0, 0, 0, .12), 0 9px 28px 8px rgba(0, 0, 0, .05);
  border-radius: 0.5rem;
`

export const MoreListItem = styled.div`
  text-align: center;
  color: var(--panel-tab-foreground);
  font-size: var(--type-ramp-base-font-size);
  padding-bottom: 0.5rem;
  cursor: pointer;

  &:last-child {
    padding-bottom: 0;
  }
`

export const TabView = styled.div`
  display: flex;
  flex: 1;
  overflow-x: hidden;
  overflow-y: auto;
`
