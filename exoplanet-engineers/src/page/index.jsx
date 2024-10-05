import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./index.css";

import Card from "react-bootstrap/Card";
import Offcanvas from "react-bootstrap/Offcanvas";

export default function Main(props) {
  const [planet, setPlanet] = useState("etheron");
  const [bounce, setBounce] = useState("1");
  const [rotate, setRotate] = useState("0");
  const [LImage, setLImage] = useState("");
  const [RImage, setRImage] = useState("");
  const [CImage, setCImage] = useState("");
  const [planets, setPlanets] = useState([]);
  const [planetIndex, setPlanetIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredPlanets, setFilteredPlanets] = useState([]);
  const [isTransitioning, setIsTransitioning] = useState(true);

  const navigate = useNavigate();

  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(!show);

  // Fetch data from MongoDB
  async function fetchData() {
    try {
      const response = await fetch("http://localhost:3000/data");
      const data = await response.json();
      setPlanets(data);
      setFilteredPlanets(data);
      setIsTransitioning(false);
      console.log("Fetched data:", data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setFilteredPlanets(
      planets.filter((planet) =>
        planet.Planet_Name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery]);

  function gotToApp(planet) {
    props.setPlanet(planet);
    navigate("/app");
  }

  useEffect(() => {
    console.log("Switching Planets");
    setBounce("1");
    setRotate("1");

    setTimeout(() => {
      if (planet === "orionis") {
        setLImage("/src/assets/images/Green_Planet.png");
        setRImage("/src/assets/images/Purple_Planet.png");
        setCImage("/src/assets/images/Blue_Planet.png");
      } else if (planet === "etheron") {
        setLImage("/src/assets/images/Blue_Planet.png");
        setRImage("/src/assets/images/Yellow_Planet.png");
        setCImage("/src/assets/images/Purple_Planet.png");
      } else if (planet === "theronix") {
        setLImage("/src/assets/images/Yellow_Planet.png");
        setRImage("/src/assets/images/Blue_Planet.png");
        setCImage("/src/assets/images/Green_Planet.png");
      } else {
        setLImage("/src/assets/images/Purple_Planet.png");
        setRImage("/src/assets/images/Green_Planet.png");
        setCImage("/src/assets/images/Yellow_Planet.png");
      }
      setBounce("0");
      setRotate("0");
    }, 250);
    console.log(planet);
  }, [planet]);

  function RightSwitch() {
    if (planet === "orionis") {
      setPlanet("etheron");
    } else if (planet === "etheron") {
      setPlanet("lumenara");
    } else if (planet === "theronix") {
      setPlanet("orionis");
    } else {
      setPlanet("theronix");
    }
    if (planetIndex + 1 === 100) {
      setPlanetIndex(0);
    } else {
      setPlanetIndex(planetIndex + 1);
    }
  }

  function LeftSwitch() {
    if (planet === "orionis") {
      setPlanet("theronix");
    } else if (planet === "etheron") {
      setPlanet("orionis");
    } else if (planet === "theronix") {
      setPlanet("lumenara");
    } else {
      setPlanet("etheron");
    }
    if (planetIndex - 1 === -1) {
      setPlanetIndex(99);
    } else {
      setPlanetIndex(planetIndex - 1);
    }
  }

  // Filter planets based on search query

  return (
    <>
      {isTransitioning && (
        <div className="transition-overlay">
          <img src="src\assets\images\transition.gif" />
        </div>
      )}
      <div className="main-container">
        <Offcanvas show={show} onHide={handleClose}>
          <Offcanvas.Header>
            <Offcanvas.Title>
              <div>
                <input
                  id="inputSearch"
                  placeholder="Search exoplanet..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "95%",
                    padding: "5px",
                    margin: "10px auto",
                    borderRadius: "5px",
                    border: "1px solid #ccc",
                  }}
                ></input>
                <button
                  onClick={handleClose}
                  style={{
                    position: "absolute",
                    top: "0px",
                    right: "10px",
                    background: "transparent",
                    border: "none",
                    fontSize: "40px",
                    cursor: "pointer",
                    zIndex: 2000,
                  }}
                >
                  &times;
                </button>
              </div>
            </Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            {filteredPlanets.map((planet, index) => (
              <Card key={index} onClick={() => gotToApp(planet)}>
                <Card.Body
                  style={{
                    backgroundColor: "cadetblue",
                    borderRadius: "8px",
                    padding: "15px",
                    margin: "10px",
                    fontFamily: "Nova Square",
                    color: "black",
                  }}
                >
                  {planet.Planet_Name}
                </Card.Body>
              </Card>
            ))}
          </Offcanvas.Body>
        </Offcanvas>
        <div className="frame">
          <span
            className="home navbar"
            onClick={handleShow}
            style={{ cursor: "pointer" }}
          >
            Search
          </span>
          <span className="about navbar" style={{ cursor: "pointer" }}>
            Home
          </span>
          <span className="contact navbar" style={{ cursor: "pointer" }}>
            Tutorial
          </span>
        </div>
        <div className="space">
          <div className="flex-row-b">
            <div className="frame-34">
              <div className="Info">
                <span className="detail-title detials">Discovery year</span>
                <span className="detials">
                  {planets[planetIndex] === undefined
                    ? "temp"
                    : planets[planetIndex].Discovery_Year}
                </span>
              </div>
              <div className="Info">
                <span className="detail-title detials">Hostname</span>
                <span className="detials">
                  {planets[planetIndex] === undefined
                    ? "temp"
                    : planets[planetIndex].Host_Name}
                </span>
              </div>
              <div className="Info">
                <span className="detail-title detials">Orbatial period</span>
                <span className="detials">
                  {planets[planetIndex] === undefined
                    ? "temp"
                    : planets[planetIndex].Orbital_Period}
                </span>
              </div>
              <div className="Info">
                <span className="detail-title detials">Earth Masses</span>
                <span className="detials">
                  {planets[planetIndex] === undefined
                    ? "temp"
                    : planets[planetIndex].Planet_Mass_Earth}
                </span>
              </div>
            </div>
          </div>
          <img
            src={CImage}
            className="CenterImage rotate rotate2"
            onClick={() => gotToApp(planets[planetIndex])}
            style={{ cursor: "pointer" }}
            rotate={rotate}
          />
        </div>
        <span className="Planet-Name">
          {planets[planetIndex] === undefined
            ? "temp"
            : planets[planetIndex].Planet_Name}
        </span>
        <div className="Left">
          <span className="Left-Name">
            {planets[planetIndex] === undefined
              ? "temp"
              : planets[planetIndex + 1 === 100 ? 0 : planetIndex + 1]
                  .Planet_Name}
          </span>
          <img
            src={RImage}
            className="sideImage bounce"
            bounce={bounce}
            onClick={RightSwitch}
            style={{ cursor: "pointer" }}
          />
        </div>
        <div className="Right">
          <img
            src={LImage}
            className="sideImage bounce"
            bounce={bounce}
            onClick={LeftSwitch}
            style={{ cursor: "pointer" }}
          />
          <span className="Right-Name">
            {planets[planetIndex] === undefined
              ? "temp"
              : planets[planetIndex - 1 === -1 ? 99 : planetIndex - 1]
                  .Planet_Name}
          </span>
        </div>
      </div>
    </>
  );
}
