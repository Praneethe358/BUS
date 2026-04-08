import type { Feature, LineString } from "geojson";
import type { Stop } from "../store/busStore";

export const sampleRoute: Feature<LineString> = {
  type: "Feature",
  geometry: {
    type: "LineString",
    coordinates: [
      [77.5946, 12.9716],
      [77.5932, 12.9738],
      [77.5911, 12.9759],
      [77.5894, 12.9774],
      [77.5871, 12.9788],
      [77.5852, 12.9799],
      [77.5832, 12.9806],
      [77.5811, 12.9812],
    ],
  },
  properties: {
    name: "Campus Loop",
  },
};

export const sampleStops: Stop[] = [
  {
    id: "stop-main-gate",
    name: "Main Gate",
    order: 1,
    lat: 12.9716,
    lng: 77.5946,
  },
  {
    id: "stop-library",
    name: "Library Circle",
    order: 2,
    lat: 12.9759,
    lng: 77.5911,
  },
  {
    id: "stop-hostel",
    name: "Hostel Block",
    order: 3,
    lat: 12.9788,
    lng: 77.5871,
  },
  {
    id: "stop-stadium",
    name: "Stadium",
    order: 4,
    lat: 12.9812,
    lng: 77.5811,
  },
];
