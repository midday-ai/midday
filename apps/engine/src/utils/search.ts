export const EU_NODE = {
  host: "u3fjvrpb1i05ek4zp-2.a1.typesense.net",
  port: 443,
  protocol: "https",
};

export const US_NODE = {
  host: "u3fjvrpb1i05ek4zp-1.a1.typesense.net",
  port: 443,
  protocol: "https",
};

export const AU_NODE = {
  host: "u3fjvrpb1i05ek4zp-3.a1.typesense.net",
  port: 443,
  protocol: "https",
};

export function getNodes() {
  return [US_NODE, EU_NODE, AU_NODE];
}

export function getNearestNode() {
  return {
    host: "u3fjvrpb1i05ek4zp.a1.typesense.net",
    port: 443,
    protocol: "https",
  };
}
