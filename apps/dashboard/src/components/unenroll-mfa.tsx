"use client";

import { createClient } from "@midday/supabase/client";
import { useEffect, useState } from "react";

export function UnenrollMFA() {
  const supabase = createClient();

  const [factorId, setFactorId] = useState("");
  const [factors, setFactors] = useState([]);
  const [error, setError] = useState(""); // holds an error message

  console.log(factors);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) {
        throw error;
      }

      setFactors(data.totp);
    })();
  }, []);

  return (
    <>
      {error && <div className="error">{error}</div>}
      <tbody>
        <tr>
          <td>Factor ID</td>
          <td>Friendly Name</td>
          <td>Factor Status</td>
        </tr>
        {factors.map((factor) => (
          <tr>
            <td>{factor.id}</td>
            <td>{factor.friendly_name}</td>
            <td>{factor.factor_type}</td>
            <td>{factor.status}</td>
          </tr>
        ))}
      </tbody>
      {/* <input
        type="text"
        value={verifyCode}
        onChange={(e) => setFactorId(e.target.value.trim())}
      /> */}
      <button onClick={() => supabase.auth.mfa.unenroll({ factorId })}>
        Unenroll
      </button>
    </>
  );
}
