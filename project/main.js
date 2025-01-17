// Set up navigation bar
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
  margin = { top: 30, bottom: 50, left: 90, right: 60}

// colors
const maroon = '#800000',
  greenGrey = '#BDD9BF',
  green = '#6FDE6E',
  yellow = '#E8F086',
  red = '#FF4242',
  lightBlue = '#235FA4',
  darkBlue = '#0A284B',
  orange = '#FFA500',
  brown = '#8B4513',
  purple = '#800080',
  pink = '#FFC0CB'

const comparisonColorScale = d3.scaleOrdinal()
  .domain(['fastest', 'slowest', 'shrinking'])
  .range([green, yellow, red])

const abroadStateColorScale = d3.scaleOrdinal()
  .domain(['abroad_total', 'from_different_state_total'])
  .range([lightBlue, darkBlue])

const regionColorScale = d3.scaleOrdinal()
  .domain(['Northeast', 'Midwest', 'South', 'West', 'Puerto Rico', 'US Island Area'])
  .range([green, yellow, red, lightBlue, darkBlue, darkBlue])

const divisionColorScale = d3.scaleOrdinal()
  .domain(['New England', 'Middle Atlantic', 'East North Central', 'West North Central', 'South Atlantic', 'East South Central', 'West South Central', 'Mountain', 'Pacific'])
  .range([green, yellow, red, lightBlue, darkBlue, orange, brown, pink, purple])

// create area for legend
const legend = {
    width: 180,
    height: 60,
    x: width - 210,
    y: 30,
  }

const stackedLegend = {
    width: 180,
    height: 60,
    x: width - 800,
    y: 30,
}

const circlePackLegend = {
  width: 180,
  height: 60,
  x: width - 210,
  y: 30,
}

// variables

let colorScale
let svg
let xScale
let yScale
let xScaleAbroadState
let yScaleAboardState

let yAxis 
let xAxisAbroadState
let yAxisAbroadState

let state = {
  data: []
}

const statesData = [
  { state: 'Utah', abbr: 'UT', percentChange: 18.4, popChange: 507731, changeCat: 'fastest' },
  { state: 'Idaho', abbr: 'ID', percentChange: 17.3, popChange: 271524, changeCat: 'fastest' },
  { state: 'Texas', abbr: 'TX', percentChange: 15.9, popChange: 3999444, changeCat: 'fastest' },
  { state: 'North Dakota', abbr: 'ND', percentChange: 15.8, popChange: 106503, changeCat: 'fastest' },
  { state: 'Neveda', abbr: 'NV', percentChange: 15,  popChange: 404063, changeCat: 'fastest' },
  { state: 'Pennsylvania', abbr: 'PA', percentChange: 2.4, popChange: 300321, changeCat: 'slowest' },
  { state: 'Illinois', abbr: 'IL', percentChange: -0.1, popChange: -19041, changeCat: 'shrinking' },
  { state: 'Mississippi', abbr: 'MS', percentChange: -0.2, popChange: -1816, changeCat: 'shrinking' },
  { state: 'West Virginia', abbr: 'WV', percentChange: -3.2, popChange: -68207, changeCat: 'shrinking' },

]

// load data
d3.csv('../data/migration_flows_from_2010_to_2019.csv', d => {
  return {
    current_state: d.current_state,
    current_region: d.region,
    current_division: d.division,
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
    
    draw()
  })


function draw() {
  
  // Create scales for statesData
  xScale = d3.scaleBand()
    .domain(statesData.map(d => d.state))
    .range([0, width - margin.left + 2])
    .padding(0.2)

  yScale = d3.scaleLinear()
    .domain([d3.min(statesData, d => d.percentChange) - 0.5, d3.max(statesData, d => d.percentChange) + 1])
    .range([height - margin.bottom, margin.top])
  // create axis
  yAxis = d3.axisLeft(yScale)

  // append svg
  svg = d3.select('#container')
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  svg.append('g')
    .attr('transform', `translate(${margin.left}, 0)`)
    .call(yAxis)
  
    // append title
  svg.append('text')
    .attr('x', (width + margin.left) / 2)
    .attr('y', margin.top / 2)
    .attr('text-anchor', 'middle')
    .attr('class', 'chart-title')
    .text('Fastest v. Slowest Growing/Shrinking States')
    
  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', - (height/2))
    .attr('y', margin.left / 2 - 30)
    .style('text-anchor', 'middle')
    .attr('class', 'axis-label')
    .text('% of Population Change')
    
  const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0)

  const tooltipStacked = d3.select('body')
    .append('div')
    .attr('class', 'tooltipStacked')
    .style('opacity', 0)
      
  
  // append rect.bars
  svg.selectAll('rect.bar')
    .data(statesData)
    .join('rect')
    .attr('class', 'bar')
    .attr('x', d => margin.left + xScale(d.state))
    .attr('y', d => yScale(Math.max(0, d.percentChange)))
    .attr('width', xScale.bandwidth())
    .attr('height', d => Math.abs(yScale(d.percentChange) - yScale(0)))
    .attr('fill', d => comparisonColorScale(d.changeCat))
    .attr('stroke', 'black')
    .attr('stroke-width', 0.5)
    .on('mouseover', (event, d, i) => {
      tooltip.style('opacity', 1)
        .html(
          `
          <p>State: ${d.state}</p>
          <p>Percent Change: ${d.percentChange}%</p>
          <p>Population Change: ${d.popChange}</p>
          `
        )
    })
    .on('mousemove', (event) => {
      tooltip.style('left', (event.pageX + 15) + 'px')
        .style('top', (event.pageY - 30) + 'px')
    })
    // clean up after myself
    .on('mouseout', () => {
      tooltip.style('opacity', 0)
    })
  // add state abbr labels to top of each rect.bar
  svg.selectAll('text.abbr-label')
    .data(statesData)
    .join('text')
    .attr('class', 'abbr-label')
    .attr('x', d => margin.left + xScale(d.state) + xScale.bandwidth() / 2)
    .attr('y', d => yScale(Math.max(0, d.percentChange)) - 8)
    .attr('text-anchor', 'middle')
    .text(d => d.abbr)
  
  // create legend  
  const legendBox = svg.append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${legend.x}, ${legend.y})`)
  
  const categories = ['Fastest Growth', 'Slowest Growth', 'Shrinking']
  
  legendBox.selectAll('rect')
    .data(categories)
    .join('rect')
    .attr('class', 'legend.rect')
    .attr('x', 0)
    .attr('y', (d, i) => i * 25)
    .attr('width', 15)
    .attr('height', 15)
    .attr('fill', d => comparisonColorScale(d))
    .attr('stroke', 'black')
    .attr('stroke-width', 0.5)
  
  legendBox.selectAll('text')
    .data(categories)
    .join('text')
    .attr('class', 'legend-label')
    .attr('x', 20)
    .attr('y', (d, i) => i * 25 + 15)
    .style('text-anchor', 'start')
    .text(d => d.charAt(0).toUpperCase() + d.slice(1))
  
  // create a line at zero
  svg.append('line')
    .attr('x1', margin.left)
    .attr('x2', width - margin.right + '2em')
    .attr('y1', yScale(0))
    .attr('y2', yScale(0))
    .attr('stroke', maroon)
    .attr('stroke-width', 1)
    .attr('opacity', 0.5)

  const statesOfInterest = statesData.map(d => d.state)

  const filterStatesData = state.data.filter(d => 
    statesOfInterest.includes(d.current_state))
  
  // The line below using Alabama arbitrarily to transform the data to
  // one instance per year
  const filterOnePerYear = filterStatesData.filter(d => d.from === 'Alabama')
  
  // this was a bear...maybe there are more idiomatic ways of doing it in D3?
  // I am convinced that I don't exactly understand reduce() if asked to explain on the spot
  // TODO: perhaps refactor for later use?
  function sumAbroadAndDiffStates (data) {
    return data.reduce((accumulator, item) => {
      const existingState = accumulator.find(
        (state) => state.current_state === item.current_state
      )
      if (existingState) {
        existingState.abroad_total += item.abroad_total
        existingState.from_different_state_total += item.from_different_state_total
      } else {
        accumulator.push({
          current_state: item.current_state,
          abroad_total: item.abroad_total,
          from_different_state_total: item.from_different_state_total,
        })
      }
      return accumulator
    }, [])
  }
  
  const sumMigrantsByState = sumAbroadAndDiffStates(filterOnePerYear)

  // build scales
  xScaleAbroadState = d3.scaleBand()
    .domain(sumMigrantsByState.map(d => d.current_state))
    .range([0, width - margin.left])
    .padding(0.2)

  yScaleAboardState = d3.scaleLinear()
    .domain([0, d3.max(sumMigrantsByState, d => 
      d.abroad_total + d.from_different_state_total)]).nice()
    .range([height - margin.bottom, margin.top])

  // create axes
  xAxisAbroadState = d3.axisBottom(xScaleAbroadState)
  yAxisAbroadState = d3.axisLeft(yScaleAboardState)
      .tickFormat(d => `${d / 1000000}M`)

  svg = d3.select('#stacked-container')
      .append('svg')
      .attr('width', width)
      .attr('height', height)
  
  // draw axes
  svg.append('g')
    .attr('transform', `translate(${margin.left}, ${height - margin.bottom})`)
    .call(xAxisAbroadState)
  
  svg.append('g')
    .attr('transform', `translate(${margin.left}, 0)`)
    .call(yAxisAbroadState)

  svg.append('text')
    .attr('x', (width + margin.left) / 2)
    .attr('y', margin.top / 2)
    .attr('text-anchor', 'middle')
    .attr('class', 'chart-title')
    .text('Migration from Abroad vs. Different US States')

  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', - (height/2))
    .attr('y', margin.left / 2 - 30)
    .style('text-anchor', 'middle')
    .attr('class', 'axis-label')
    .text('# of Migrants (in millions)')

  const stack = d3.stack()
      .keys(['abroad_total', 'from_different_state_total'])
      .order(d3.stackOrderDescending)

  const stackedData = stack(sumMigrantsByState)
  
  const grouped = svg.selectAll('g.stacked-bar')
      .data(stackedData)
      .join('g')
      .attr('class', 'stacked-bar')
      .attr('fill', d => abroadStateColorScale(d.key))

  grouped.selectAll('rect.stacked-bar')
      .data(d => d)
      .join('rect')
      .attr('class', 'stacked-bar')
      .attr('x', (d, i) => margin.left + xScaleAbroadState(sumMigrantsByState[i].current_state))
      .attr('y', d => yScaleAboardState(d[1]))
      .attr('width', xScaleAbroadState.bandwidth())
      .attr('height', d => yScaleAboardState(d[0]) - yScaleAboardState(d[1]))
      .attr('stroke', 'black')
      .attr('stroke-width', 0.5)
      .on('mouseover', (event, d) => {
        const k = d3.select(event.currentTarget.parentNode).datum().key
        const currentStateData = sumMigrantsByState.find(entry => entry.current_state === d.data.current_state)
        const relativeTotal = currentStateData.abroad_total + currentStateData.from_different_state_total
        let hoverData = ''

        if (k === 'abroad_total') {
          hoverData = 
          `
          <p>From Abroad: ${currentStateData.abroad_total}</p>
          <p>% from Aboard: ${((currentStateData.abroad_total * 100) / relativeTotal).toFixed(0)}%</p>
          `
        } else if (k === 'from_different_state_total') {
          hoverData = 
          `
          <p>From Different State: ${currentStateData.from_different_state_total}</p>
          <p>% Different State: ${((currentStateData.from_different_state_total * 100) / relativeTotal).toFixed(0)}%</p>
          `
        }
        tooltipStacked.style('opacity', 1).html(hoverData)
      })
      .on('mousemove', (event) => {
      tooltipStacked.style('left', (event.pageX + 15) + 'px')
        .style('top', (event.pageY - 30) + 'px')
    })
      .on('mouseout', () => {
        tooltipStacked.style('opacity', 0)
      })
  
  const stackedCategories = ['From Abroad', 'From Different State']

  // create legend for stacked barchart
  const stackedLegendBox = svg.append('g')
      .attr('class', 'stacked-legend')
      .attr('transform', `translate(${stackedLegend.x}, ${stackedLegend.y})`)
  
  stackedLegendBox.selectAll('rect')
    .data(stackedCategories)
    .join('rect')
    .attr('class', 'stacked-legend.rect')
    .attr('x', 0)
    .attr('y', (d, i) => i * 25)
    .attr('width', 15)
    .attr('height', 15)
    .attr('fill', d => abroadStateColorScale(d))
    .attr('stroke', 'black')
    .attr('stroke-width', 0.5)

  stackedLegendBox.selectAll('text')
    .data(stackedCategories)
    .join('text')
    .attr('class', 'stacked-legend-label')
    .attr('x', 20)
    .attr('y', (d, i) => i * 25 + 15)
    .style('text-anchor', 'start')
    .text(d => d.charAt(0).toUpperCase() + d.slice(1))

  // ++ CIRCLE PACK GRAPH FOR REGION, DIVISION, FROM (state)
  
  // get data for only Utah
  utahRawData = state.data.filter(d => 
    d.current_state === 'Utah' && 
      d.from !== 'abroad_ForeignCountry'
    )

  // aggregate data at `from` state level 
  // TODO: refactor to one function like other groupedData?
  const stateGroupedData = utahRawData.reduce((accumulator, item) => {
    if (accumulator[item.from]) {
      accumulator[item.from].number_of_people += item.number_of_people
    } else {
      accumulator[item.from] = {
        number_of_people: item.number_of_people,
        region: item.from_region,
        division: item.from_division
      }
    }
    return accumulator
  }, {})

  const stateSummedData = Object.keys(stateGroupedData).map(key => ({
    from_name: key,
    from_value: stateGroupedData[key].number_of_people,
    region: stateGroupedData[key].region,
    division: stateGroupedData[key].division,
  }))

  const circlePackTooltip = d3.select('body')
    .append('div')
    .attr('class', 'circlePackTooltip')
    .style('opacity', 0)
  
  const hierarchy = d3.hierarchy({
    from_name: '',
    from_value: 0,
    region: '',
    division: '',
    children: stateSummedData
    })
      .sum(d => d.from_value) 
      .sort((a, b) => b.value - a.value)

  const circlePack = d3.pack()
    .size([width, height])
    .padding(2)
  
  const base = circlePack(hierarchy)
  
  svg = d3.select('#circle-pack-container')
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  let circlePackColorScheme = 'region'

  function toggleColorScheme() {
    circlePackColorScheme = circlePackColorScheme === 'region' ? 'division' : 'region'
    node.selectAll('circle')
      // this seems dangerious, but it works!
      .style('fill', d => d.parent 
      ? (circlePackColorScheme === 'region' 
      ? regionBubbleColor(d.data.region) 
      : divisionBubbleColor(d.data.division)) 
      : 'white')

    const button = document.getElementById('toggle-color-scheme')
    button.textContent = circlePackColorScheme === 'region' 
      ? 'Color Code by Division' 
    : 'Color Code by Region'

      createCircleLegend()
  }

  // listener for button
  document.getElementById('toggle-color-scheme').addEventListener('click', toggleColorScheme)

  createCircleLegend()
  
  function regionBubbleColor(region) {
    const bubbleColorMap = {
      'Northeast': green,
      'Midwest': yellow,
      'South': red,
      'West': lightBlue,
      'Puetro Rico': darkBlue,
      'US Island Area': darkBlue,
    }
    return bubbleColorMap[region]
  }

  function divisionBubbleColor(division) {
    const bubbleColorMap = {
      'New England': green,
      'Middle Atlantic': yellow,
      'East North Central': red,
      'West North Central': lightBlue,
      'South Atlantic': darkBlue,
      'East South Central':orange,
      'West South Central': brown,
      'Mountain': pink,
      'Pacific': purple,
    }
    return bubbleColorMap[division]
  }

  function createCircleLegend() {
    // Remove any existing legend
    svg.select('.circle-pack-legend').remove()
  
    // Create a new legend based on the current color scheme
    const legendBox = svg.append('g')
      .attr('class', 'circle-pack-legend')
      .attr('transform', `translate(${circlePackLegend.x}, ${circlePackLegend.y})`)
  
    const colorScale = circlePackColorScheme === 'region' 
      ? regionColorScale : divisionColorScale
    const categories = colorScale.domain()
    
    // generating the legend
    legendBox.selectAll('rect')
      .data(categories)
      .join('rect')
      .attr('class', 'legend.rect')
      .attr('x', 0)
      .attr('y', (d, i) => i * 25)
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', d => colorScale(d))
      .attr('stroke', 'black')
      .attr('stroke-width', 0.5)
  
    legendBox.selectAll('text')
      .data(categories)
      .join('text')
      .attr('class', 'legend-label')
      .attr('x', 20)
      .attr('y', (d, i) => i * 25 + 15)
      .style('text-anchor', 'start')
      .text(d => d.charAt(0).toUpperCase() + d.slice(1))
  }
  
  const node = svg.selectAll('g')
    .data(base.descendants())
    .join('g')
    .attr('transform', d => `translate(${d.x},${d.y})`)

  svg.append('text')
    .attr('x', (width + margin.left) / 2)
    .attr('y', margin.top / 2)
    .attr('text-anchor', 'middle')
    .attr('class', 'chart-title')
    .text('From which U.S. states are people moving to Utah?')
  
  node.append('circle')
    .attr('r', d => d.r)
    .style('fill', d => 
      d.parent ? (circlePackColorScheme === 'region' 
      ? regionBubbleColor(d.data.region) 
      : divisionBubbleColor(d.data.division)) 
      : 'white')
    .filter(d => d.parent)
    .on('mouseover', (event, d) => {
      circlePackTooltip.style('opacity', 1)
      .html(
        `
        <p>State: ${d.data.from_name}</p>
        <p># Migrants: ${d.data.from_value}</p>
        <p>Region: ${d.data.region}</p>
        <p>Sub-region: ${d.data.division}</p>
        `
      )
      d3.select(event.currentTarget)
        .transition()
        .duration(200)
        .attr('stroke', 'black')
        .attr('stroke-width', 1)
        .attr('r', d => d.r * 1.1)
      
      d3.select(event.currentTarget.parentNode)
        .raise()
    })
    .on('mousemove', (event) => {
      circlePackTooltip.style('left', (event.pageX + 18) + 'px')
      .style('top', event.pageY - 25 + 'px')
    })
    .on('mouseout', (event, d) => {
      circlePackTooltip.style('opacity', 0)
      d3.select(event.currentTarget)
        .transition()
        .duration(200)
        .attr('stroke', 'none')
        .attr('r', d => d.r)

    

    })
  
  createCircleLegend()

}





