// Set up navbar
document.addEventListener('DOMContentLoaded', () => {
  const navContainer = document.getElementById('navbar')

  fetch('navbar.html')
    .then(response => response.text())
    .then(html => {
      navContainer.innerHTML = html
    })
  .catch(err => {
    console.warn("Navbar not loaded:", err)
  })
})

// constants and global variables
const width = window.innerWidth * 0.7,
  height = window.innerHeight * 0.7,
  margin = { top: 20, bottom: 50, left: 90, right: 60}

// colors
const maroon = '#008000',
  lightGrey = '#D3D3D3',
  teal = '#008080'

// create area for legend
const legend = {
    width: 180,
    height: 60,
    x: width - 210,
    y: 30,
  }

/*
these variables allow us to access anything we manipulate in init() 
but need access to in draw(); all these variables are empty before we assign 
something to them.
*/

let colorScale
let svg
let xScale
let yScale
let xAxis
let yAxis

// TODO: create legend again? Or should this happen in draw()

let state = {
  data: [],
  selection: "All", // TODO: do I need a filter?
}

// load data
d3.csv('../data/migration_flows_from_2010_to_2019.csv', d => {
  return {
    current_state: d.current_state,
    current_region: d.region,
    current_division: d.divsion,
    year: new Date(+d.year, 0, 1),
    population: +d.population,
    same_house: +d.same_house,
    same_state: +d.same_state,
    from_different_state_total: +d.from_different_state_Total,
    abroad_total: +d.abroad_Total,
    from: d.from,
    from_region: d.from_region,
    from_division: d.from_division,
    number_of_people: +d.number_of_people,
  }
})
  .then(raw_data => {
    state.data = raw_data
    console.log('state data >>', state.data)  // diagnostic
    init()
  })

  /* process data
  - Filter out Utah data
  - 
  */
  function init() {
        // filter Utah data
        const utahData = state.data
        .filter(d => d.current_state === 'Utah')
      console.log('Utah data >>', utahData) // diagnostic
  
      // group data by year; create objects with years as keys
      // 
      const groupedByYear = d3.rollup(utahData, i => {
        const firstInstance = i[0]
        return {
          from_different_state_total: firstInstance.from_different_state_total,
          abroad_total: firstInstance.abroad_total,
          utah_total: firstInstance.population,
        }
      }, d => d.year)
  
      console.log('grouped by year >>', groupedByYear) // diagnostic
  
      // Convert Map objects to array of objects
      const aggByYear = Array.from(groupedByYear, ([year, values]) =>
        ({year: new Date(year), ...values}))
  
      console.log('agg by year >>', aggByYear) // diagnostic
  
      let totalGrowthFromDifferentStates = 0
      let totalGrowthFromAbroad = 0
      let totalGrowthInState = 0 
      let previousYearPop = 0
  
      aggByYear.forEach(d => {
        totalGrowthFromDifferentStates += d.from_different_state_total
        totalGrowthFromAbroad += d.abroad_total
  
        if (previousYearPop > 0) {
          totalGrowthInState += d.utah_total - previousYearPop
        }
        previousYearPop = d.utah_total
      })
  
      // prep data for barchart
      const simpleChartData = [
        { typeOfMigration : 'From Different States', value : totalGrowthFromDifferentStates },
        { typeOfMigration : 'From Abroad', value : totalGrowthFromAbroad },
        { typeOfMigration : 'Internal Growth', value : totalGrowthInState },
      ]
      
      console.log('bar chart data >>', simpleChartData)

    // create scales
    xScale = d3.scaleBand()
      .domain(simpleChartData.map(d => d.typeOfMigration))
      .range([0, width - margin.right])
      .paddingInner(0.2)
    
    yScale = d3.scaleLinear()
      // nice() function: https://www.d3indepth.com/scales/
      .domain([0, d3.max(simpleChartData, d => d.value)]).nice()
      .range([height - margin.bottom, margin.top])


    
    // set the color scale
    colorScale = d3.scaleOrdinal()
      .range([maroon, teal, lightGrey])

    svg = d3.select('#container')
      .append('svg')
      .attr('width', width)
      .attr('height', height)

    // assign axes to scales
    xAxis = d3.axisBottom(xScale)
    yAxis = d3.axisLeft(yScale)
    
    // draw axes
    svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${height - margin.bottom})`)
      .call(xAxis)

    svg
      .append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(yAxis)

    // draw axis labels
    svg
      .append('text')
      .attr(
        'transform', 
        `translate(${width  / 2 + margin.right}, ${height - margin.bottom + 45})`)
      .style('text-anchor', 'middle')
      .attr('class', 'axis-label')
      .text('Type of Immigration')

    svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', - (height/2))
      .attr('y', margin.left / 2 - 30)
      .style('text-anchor', 'middle')
      .attr('class', 'axis-label')
      .text('Migrants to Utah')

    draw()
  }

  function draw() {

  }
