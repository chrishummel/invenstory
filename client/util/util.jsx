import React from 'react'

import { store } from '../store/initStore'
import { smartDispatch } from '../dispatcher'
import { UPDATE_LAST_CHANGED, UPDATE_NOTIFICATIONS, UPDATE_DETAIL_DATA, UPDATE_GRAPH_DATA, UPDATE_TABLE_DATA, UPDATE_AUTHENTICATION } from '../actionTypes'

//Get rid of console.logs when not developing or testing
//
// console.log(process.env.NODE_ENV, process.env.NODE_ENV==="development")
// if(process.env.NODE_ENV !== "development" && process.env.NODE_ENV !== "test")
//   require('noconsole')

// // Used to test dispatching actions
// setTimeout( function(){
//   subscribeTo("detail", function(stuff){console.log("detail TRIGGERED", stuff)})
// },100)

// setTimeout( function(){
//   smartDispatch(UPDATE_INVENTORY, null)
// }, 2000);


/*
  function redirect:
  Takes a URL as a parameter (relative or absolute)
  Takes an optional parameter for the window object (used for testing)

  return a function that will redirect to the given address when invoked
 */

export function redirect(address, _window = window){
  return function (address){
    _window.location.href = address
  }.bind(null, address)
}


/*
  function subscribeTo
  Takes a string and a callback as parameters.
  Return's nothing.
  Wraps the store's subscribe method and only calls your callback when
  the most recentlychanged value matches the string you enterred as a property.

  This is intended to prevent unneeded re-renders by only triggering when relevant.
 */

export function subscribeTo(property, callback){

  let action = {
    detail: {
      UPDATE_DETAIL_DATA: true
    },
    authenticated: {
      UPDATE_AUTHENTICATION: true
    },
    tableData: {
      UPDATE_TABLE_DATA: true
    },
    graphData: {
      UPDATE_GRAPH_DATA: true
    },
    tab: {
      CHANGE_TAB: true
    },
    notifications: {
      UPDATE_NOTIFICATIONS: true
    }
  }

  if( ! action[property])
    throw new Error(`You tried to subscribe to ${property} but you may have meant on of the following: detail, inventory, authenticated, tableData, notifications, graphData, tab`)

  store.subscribe(function(){

    let tempState = store.getState();
    let changed = tempState.lastChanged

    if(action[property][changed])
      callback(tempState)
  })
}


/*
  Called whenever new data is recieved by requests: processNewInventory
  All of the functions invoked within processNewData format the new data as needed and save it to the store.
 */

export function processNewData(data){
  //Each of these functions return something for testing purposes, but don't need to. 

  let withProfit = processRawInventory(data)
  
  processGeneralGraphData(withProfit)
  processGeneralTableData(withProfit)
  processNotifications(withProfit)
  
  // console.log("raw", JSON.stringify(data) )
  // console.log("processed", JSON.stringify(withProfit) )
  // console.log("graph", JSON.stringify(processGeneralGraphData(withProfit)) )
  // console.log("table",JSON.stringify(processGeneralTableData(withProfit)) )
  // console.log("notif",JSON.stringify(processNotifications(withProfit)) )
}


export function processRawInventory(inventory){
  inventory = inventory.map(function(cur){
   cur.profit = cur.avg_purchase_price && cur.amzn_price_fba && Math.round((cur.amzn_price_fba - cur.avg_purchase_price) / cur.avg_purchase_price*100)
    Object.keys(cur).map(function(key){
      return (cur[key] === null || cur[key] === undefined)
       ? cur[key] = 0
       : cur[key]
    })
    return cur;
  })

  return inventory
}

export function processNotifications(inventory){

  let notifications = inventory.filter(function(cur){
    return cur.profit > 150 //could build in setting here
  })
  .sort(function(a, b){
    return b.profit - a.profit
  })

  smartDispatch(UPDATE_NOTIFICATIONS, notifications)
  return notifications
}

/**
 * processGeneralGraphData - A function that processes the inventory data to a format usable by the bar graph
 *
 * @param  {Array}   inventory  An array of ojects containing product data
 * @return {Promise}
 */
export function processGeneralGraphData(inventory){

  let lineData =  [['SKU', 'Cost', {type: 'string', role: 'tooltip'}, 'Current Value', {type: 'string', role: 'tooltip'}]]; 
  let priceData = inventory.forEach(function(cur, ind){
    const amznPrice = cur.amzn_price_fba || cur.amzn_price_fbm;
    lineData.push(
      [
        cur.seller_sku,
        Math.round(cur.avg_purchase_price*100) / 100,
        cur.amzn_title && cur.amzn_title.slice(0,35) + ", QTY:" + cur.quantity + " COST: $" + cur.avg_purchase_price.toFixed(2) + " TOT COST: $" + (cur.avg_purchase_price * cur.quantity).toFixed(2),
        Math.round(amznPrice * 100) / 100,
        cur.amzn_title && cur.amzn_title.slice(0,35) + ", CUR VAL: $" + amznPrice.toFixed(2) + " TOT VAL: $" + (amznPrice * cur.quantity).toFixed(2) + " GAIN: " + ((amznPrice - cur.avg_purchase_price) / cur.avg_purchase_price * 100).toFixed(0) + "%"
      ]
    )
  })
  smartDispatch(UPDATE_GRAPH_DATA, lineData)
  return lineData
}

export function processGeneralTableData(inventory){
  let tableData = inventory.map(function(cur){
    return {
      "Pic": <img src={cur.amzn_thumb_url} style={{width: 50, height:50, padding:0, margin:0}} />,
      "SKU": cur.seller_sku,
      "ASIN": cur.amzn_asin,
      "Title": cur.amzn_title && (cur.amzn_title.slice(0,100)),
      "QTY": cur.quantity,
      "Cost": cur.avg_purchase_price && "$" + (Math.round(cur.avg_purchase_price*100)/100).toFixed(2),
      "FBM Price": cur.amzn_price_fbm && "$" + (Math.round(cur.amzn_price_fbm*100)/100).toFixed(2),
      "FBA Price": cur.amzn_price_fba && "$" + (Math.round(cur.amzn_price_fba*100)/100).toFixed(2),
      "Total Value": cur.amzn_price_fba ? "$" + (Math.round(cur.amzn_price_fba * cur.quantity * 100)/100).toFixed(2) : "$" + (Math.round(cur.amzn_price_fbm * cur.quantity * 100)/100).toFixed(2),
      "% Gain": cur.avg_purchase_price && (cur.amzn_price_fba || cur.amzn_price_fbm) && Math.round(((cur.amzn_price_fba || cur.amzn_price_fbm) - cur.avg_purchase_price) / cur.avg_purchase_price * 100) + "%",
      " ": <button onClick={smartDispatch.bind(null, UPDATE_DETAIL_DATA, cur)}> View Details </button>,
    }
  })
  console.log(tableData)
  smartDispatch(UPDATE_TABLE_DATA, tableData)
  return tableData
}
 