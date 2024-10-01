import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const fetchReport = (vinCard, source) => {
  let method;
  switch (source) {
    case "Carfax":
      method = "carfax";
      break;
    case "Autocheck":
      method = "autocheck";
      break;
    default:
      throw new Error("Invalid source");
  }

  return axios
    .get(`${process.env.CARSIMULCAST_URI}getrecord/${method}/${vinCard}`, {
      headers: {
        "API-KEY": process.env.CARSIMULCAST_API_KEY,
        "API-SECRET": process.env.CARSIMULCAST_SECRET_KEY,
        "Content-Type": "application/pdf",
        "Content-Diposition": "inline;filename=sticker.pdf",
      },
    })
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      throw error;
    });
};

export default fetchReport;
