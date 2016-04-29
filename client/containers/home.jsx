import React from 'react'
import { LineChart } from 'rd3'

import { subscribeTo, checkAuth, processNewInventory } from '../util/util'
import Navbar from '../components/navbar'
import Home from '../components/home'
import { store } from '../store/initStore'

export default class HomeContainer extends React.Component{

  constructor(props){
    super(props)
    this.state = {
      graphData: store.getState().graphData
    }

    let component = this;
    subscribeTo("graphData", function(newState){
      console.log("NEWSTATE home", JSON.stringify(newState.graphData))

      try{
        component.setState({ "graphData": newState.graphData })
      } catch (e){
        console.log('caught error thingy', e)
        component.state.graphData = newState.graphData
      }
    })
  }

  componentWillMount(){
    checkAuth()
  }

  render(){
    return <div>
      {
        this.state.graphData.length > 0 && this.state.graphData[0].values.length === 0
        ? <h1 className="styles__centerGraph___PVBDK"> You don't have any data!</h1>
        : <div>
            <LineChart
              data={this.state.graphData}
              className="styles__centerGraph___PVBDK"
              width={400}
              height={400}
              viewBoxObject={{
                x: 0,
                y: 0,
                width: 500,
                height: 400
              }}
              title="Inventory Value"
              yAxisLabel="Value ($)"
              xAxisLabel="Time"
              gridHorizontal={true}
            />
            <Home />
          </div>
      }
    </div>
  }
}
