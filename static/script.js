document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("numSpans").addEventListener("change", updateSpanDetails);
});

// Gather basic data
let numSupports = parseInt(document.getElementById("numSupports").value);
let numJoints = parseInt(document.getElementById("numJoints").value);
let numNodes = numSupports + numJoints;
let numSpans = numNodes - 1;
let length_of_beam = 0;
let settlementPositions = [];

// Initialize arrays for storing span and node data
let spans = [];
let nodes = [];

const P_C = "P_C"; // point load in center
const P_X = "P_X"; // Point load at distance 'a' from left end and 'b' from the right end
const P_C_2 = "P_C_2"; // Two equal point loads, spaced at 1/3 of the total length from each other
const P_C_3 = "P_C_3"; // Three equal point loads, spaced at 1/4 of the total length from each other
const UDL = "UDL"; // Uniformly distributed load over the whole length (UDL)
const UDL_2_R = "UDL/2_R"; // Uniformly distributed load over half of the span on the right side
const UDL_2_L = "UDL/2_L"; // Uniformly distributed load over half of the span on the left side
const VDL_R = "VDL_R"; // Variably distributed load, with highest point on the right end
const VDL_L = "VDL_L"; // Variably distributed load, with highest point on the left end
const VDL_C = "VDL_C"; // Variably distributed load, with highest point at the center

function updateSpanDetails() {
  let numSpans = document.getElementById("numSpans").value;
  let spanDetailsContainer = document.getElementById("spanDetails");
  spanDetailsContainer.innerHTML = "";

  for (let i = 1; i <= numSpans; i++) {
    let spanDiv = document.createElement("div");
    spanDiv.innerHTML = `
          <h3>Span ${i}</h3>
          <div>
            <div>
              <label for="spanLength${i}">Length of Span ${i}:</label>
              <input type="number" id="spanLength${i}" name="spanLength${i}" required><br>
            </div>
            
            <div>
              <label for="loadingCondition${i}">Loading Condition on Span ${i}:</label>
              <select type="text" id="loadingCondition${i}" name="loadingCondition${i}" onchange="updateLoadingCondition(${i})" required>
                <option value="none">None</option>
                <option value="P_C">Point load at center</option>
                <option value="P_X">Point load at distance 'a' from left end and 'b' from the right end </option>
                <option value="P_C_2">Two equal point loads, spaced at 1/3 of the total length from each other</option>
                <option value="P_C_3">Three equal point loads, spaced at 1/4 of the total length from each other</option>
                <option value="UDL">Uniformly distributed load over the whole length</option>
                <option value="UDL/2_R">Uniformly distributed load over half of the span on the right side </option>
                <option value="UDL/2_L">Uniformly distributed load over half of the span on the left side</option>
                <option value="VDL_R">Variably distributed load, with highest point on the right end</option>
                <option value="VDL_L">Variably distributed load, with highest point on the left end </option>
                <option value="VDL_C">Variably distributed load, with highest point at the center</option>
              </select>
            </div>
          </div>

          <div id="additionalInputs${i}"></div>
          <br>

          <div>
            <label for="magnitudeOfLoad${i}">Magnitude of Load on Span ${i}:</label>
            <input type="number" id="magnitudeOfLoad${i}" name="magnitudeOfLoad${i}" required><br>
          </div>
      `;
    spanDetailsContainer.appendChild(spanDiv);
  }
}

function updateLoadingCondition(spanIndex) {
  let selectedCondition = document.getElementById(`loadingCondition${spanIndex}`).value;
  let additionalInputsContainer = document.getElementById(`additionalInputs${spanIndex}`);
  additionalInputsContainer.innerHTML = "";

  if (selectedCondition === "P_X") {
    additionalInputsContainer.innerHTML = `
          <label for="spanALength${spanIndex}">Distance from point load to the left end joint (Span A Length):</label>
          <input type="number" id="spanALength${spanIndex}" name="spanALength${spanIndex}" required><br>
      `;
  }
}

document.getElementById("beamForm").addEventListener("submit", function (event) {
  event.preventDefault();
  // Populate spans array with user input
  for (let i = 0; i < numSpans; i++) {
    spans.push({
      spanLength: parseInt(document.getElementById(`spanLength${i + 1}`).value),
      load: parseInt(document.getElementById(`magnitudeOfLoad${i + 1}`).value),
      loadingCondition: document.getElementById(`loadingCondition${i + 1}`).value,
      // Add other properties as needed
    });
  }

  // Initialize nodes - Placeholder, further logic needed

  // calculate FEM
  spans.forEach((span, i) => {
    switch (span.loadingCondition) {
      case "P_C":
        span.rightFem = (span.load * span.spanLength) / 8;
        span.leftFem = -span.rightFem;
        break;

      case "P_X":
        // Assuming spanAValue is already set in span, otherwise, you need to set it here.
        let a = span.spanAValue;
        let b = span.spanLength - a;
        span.rightFem = (span.load * b * a * a) / (span.spanLength * span.spanLength);
        span.leftFem = (span.load * b * b * a) / (span.spanLength * span.spanLength);
        break;

      case "P_C_2":
        span.rightFem = (2 * span.load * span.spanLength) / 9;
        span.leftFem = -span.rightFem;
        break;

      case "P_C_3":
        span.rightFem = (15 * span.load * span.spanLength) / 48;
        span.leftFem = -span.rightFem;
        break;

      case "UDL":
        span.rightFem = (span.load * span.spanLength * span.spanLength) / 12;
        span.leftFem = -span.rightFem;
        break;

      case "UDL/2_R":
        span.rightFem = (11 * span.load * span.spanLength * span.spanLength) / 192;
        span.leftFem = -((5 * span.load * span.spanLength * span.spanLength) / 192);
        break;

      case "UDL/2_L":
        span.rightFem = (5 * span.load * span.spanLength * span.spanLength) / 192;
        span.leftFem = -((11 * span.load * span.spanLength * span.spanLength) / 192);
        break;

      case "VDL_R":
        span.rightFem = (span.load * span.spanLength * span.spanLength) / 20;
        span.leftFem = -((span.load * span.spanLength * span.spanLength) / 30);
        break;

      case "VDL_L":
        span.rightFem = (span.load * span.spanLength * span.spanLength) / 30;
        span.leftFem = -((span.load * span.spanLength * span.spanLength) / 20);
        break;

      case "VDL_C":
        span.rightFem = (5 * span.load * span.spanLength * span.spanLength) / 96;
        span.leftFem = -span.rightFem;
        break;

      case "none":
      default:
        span.rightFem = 0;
        span.leftFem = 0;
        console.log(`No loading on span ${i + 1}`);
    }
  });

  function extractBeamData() {
    const data = {};
  
    // Number inputs
    data.numSupports = parseInt(document.getElementById("numSupports").value);
    data.numJoints = parseInt(document.getElementById("numJoints").value);
    data.numSpans = parseInt(document.getElementById("numSpans").value);
  
    // Span details (assuming dynamic generation)
    const spanInputs = document.getElementById("spanDetails").querySelectorAll(".span-input");
    data.spans = [];
    for (const input of spanInputs) {
      const spanData = {
        span_length: parseFloat(input.querySelector(".length").value),
        load: parseFloat(input.querySelector(".load").value),
        loading_condition: input.querySelector(".loading-condition").value,
      };
      data.spans.push(spanData);
    }
  
    // Settlement (check selected option)
    const settlementSelect = document.getElementById("settlement");
    data.hasSettlement = settlementSelect.value === "yes";
  
    // Settlement details (if applicable)
    if (data.hasSettlement) {
      const settlementInputs = document.getElementById("settlementDetails").querySelectorAll(".settlement-input");
      data.settlements = [];
      for (const input of settlementInputs) {
        const settlementData = {
          position: parseInt(input.querySelector(".position").value),
          value: parseFloat(input.querySelector(".value").value),
        };
        data.settlements.push(settlementData);
      }
    }
  
    // Fixed ends (check selected options)
    data.firstNodeFixed = document.getElementById("firstNodeFixed").value === "yes";
    data.lastNodeFixed = document.getElementById("lastNodeFixed").value === "yes";
  
    return data;
  }

  async function callApi(data) {
    try {
      const response = await fetch('http://127.0.0.1:6900/calculate', { 
        method: 'POST', 
        body: JSON.stringify(data), 
        headers: { 'Content-Type': 'application/json'} 
      });
      const payload = await response.json();
      console.log(payload);
      displayBeamAnalysisResults(payload);
    } catch (e) {
      console.log(e);
    }
  }
  
  // Add event listener to the calculate button
  const calculateButton = document.querySelector("button[type='submit']");
  calculateButton.addEventListener("click", function(event) {
    event.preventDefault(); // Prevent default form submission
  
    const { numSupports, numJoints, spans, settlements, firstNodeFixed, lastNodeFixed, hasSettlement } = extractBeamData();
    // Use the extracted data for your actual beam analysis here
    // console.log("Beam data:", beamData);
    const settlement_positions = settlements?.map(x => x.position) || [];
    const settlement_values = settlements?.map(x => x.value) || [];

    const payload = {
      number_of_supports: numSupports,
      number_of_internal_joints: numJoints,
      span_data: spans,
      "settlement_positions": settlement_positions,
      "settlement_values": settlement_values, 
      "settlement_on_beam": hasSettlement,
      "first_node_fixed": firstNodeFixed,
      "last_node_fixed": lastNodeFixed
    }

    callApi(payload);

    // You might want to add logic to display results or handle errors here
  });
});
