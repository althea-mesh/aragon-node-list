import React from 'react'
import {
  Button,
  Text,
  Card,
  theme,
} from '@aragon/ui'
import styled from 'styled-components'

const CardContainer = styled(Card)`
  visibility: ${props => props.visibility};
  background-color: ${props => props.background};
  padding: 10mm;
  padding-bottom: 50mm;
  margin-top: 10mm;
  margin-bottom: 10mm;
  heigh: 100px;
`

export default class CardComponent extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      visibility: 'hidden',
      bg: theme.gradientStart
    }
  }

  handleDebugToggle() {
    this.setState({
      visibility: this.state.visibility === 'hidden' ? 'visible' : 'hidden'
    })
  }

  render() {
    let text = 'This node'
    if (this.props.existingNode) {
      this.state.bg = theme.badgeAppForeground
      text.concat('', ' is in list')
    } else {
      this.state.bg = theme.negative
      text.concat('', ' is not in list')
    }
    return(
      <div>
        <CardContainer
          visibility={this.state.visibility}
          background={this.state.bg}
        >
          <Text>{text}</Text>
        </CardContainer>
        <Button 
          mode='strong'
          onClick={() => this.handleDebugToggle()}
          type='submit'
        >
          Debug
        </Button>
      </div>
    )
  }
}