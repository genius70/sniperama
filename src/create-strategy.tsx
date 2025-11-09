import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

const strategyCategories = {
  Bullish: [
    "Long Call",
    "Short Put",
    "Bull Call Spread",
    "Bull Put Spread",
    "Jade Lizard",
    "Synthetic Long Underlying",
  ],
  Bearish: [
    "Short Call",
    "Long Put",
    "Bear Call Spread",
    "Bear Put Spread",
    "Reverse Jade Lizard",
    "Synthetic Short Underlying",
  ],
  Neutral: [
    "Long Straddle",
    "Short Straddle",
    "Long Strangle",
    "Short Strangle",
    "Long Iron Butterfly",
    "Short Iron Butterfly",
    "Long Calls Butterfly",
    "Short Calls Butterfly",
    "Long Puts Butterfly",
    "Short Puts Butterfly",
    "Long Iron Condor",
    "Short Iron Condor",
    "Strip",
    "Strap",
    "Long Calls Condor",
    "Short Calls Condor",
    "Long Puts Condor",
    "Short Puts Condor",
  ],
};

const StrategyDetails = ({ strategy }: { strategy: string }) => {
  const [fee, setFee] = useState(5);
  const [legs, setLegs] = useState([{ type: "", strike: "" }]);
  const [strategyName, setStrategyName] = useState("");
  const [strategyDescription, setStrategyDescription] = useState("");

  const calculateShare = (fee: number) => {
    const platform = 2.5;
    const creator = fee - platform;
    return { creator, platform };
  };

  const handleAddLeg = () => {
    setLegs([...legs, { type: "", strike: "" }]);
  };

  const handleRemoveLeg = (index: number) => {
    setLegs(legs.filter((_, i) => i !== index));
  };

  const handleLegChange = (
    index: number,
    field: "type" | "strike",
    value: string,
  ) => {
    const updatedLegs = [...legs];
    updatedLegs[index][field] = value;
    setLegs(updatedLegs);
  };

  const { creator, platform } = calculateShare(fee);

  return (
    <div className="border rounded-xl p-4 shadow-md bg-white w-full">
      <h2 className="text-xl font-bold mb-2">
        {strategy} Template
      </h2>
      <p className="mb-4">
        Setup trade parameters, option legs, and strike prices for your{" "}
        {strategy} strategy.
      </p>

      <label className="block mb-2 font-medium">Strategy Name</label>
      <input
        type="text"
        value={strategyName}
        onChange={e => setStrategyName(e.target.value)}
        placeholder="Enter strategy name"
        className="border p-2 rounded w-full mb-4"
      />

      <label className="block mb-2 font-medium">Strategy Description</label>
      <textarea
        value={strategyDescription}
        onChange={e => setStrategyDescription(e.target.value)}
        placeholder="Enter description..."
        className="border p-2 rounded w-full mb-4"
        rows={3}
      />

      <label className="block mb-2 font-medium">Platform Fee Sharing</label>
      <input
        type="range"
        title="Fee Percentage"
        min="5"
        max="25"
        step="1"
        value={fee}
        onChange={e => setFee(Number(e.target.value))}
        className="w-full mb-2"
      />
      <p className="text-sm mb-4">
        Selected Fee: {fee}% ({creator.toFixed(1)}% Creator / {platform}%
        Platform)
      </p>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {legs.map((leg, index) =>
          <React.Fragment key={index}>
            <input
              className="border p-2 rounded"
              placeholder={`Leg ${index + 1} - Type (Call/Put)`}
              value={leg.type}
              onChange={e => handleLegChange(index, "type", e.target.value)}
            />
            <div className="flex items-center gap-2">
              <input
                className="border p-2 rounded w-full"
                placeholder={`Leg ${index + 1} - Strike Price`}
                value={leg.strike}
                onChange={e => handleLegChange(index, "strike", e.target.value)}
              />
              {legs.length > 1 &&
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemoveLeg(index)}
                >
                  Remove
                </Button>}
            </div>
          </React.Fragment>,
        )}
      </div>

      <Button variant="outline" onClick={handleAddLeg} className="mb-4">
        Add Leg
      </Button>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <input className="border p-2 rounded" placeholder="Expiry (Days)" />
        <input
          className="border p-2 rounded"
          placeholder="Target Entry Premium ($)"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="border rounded-lg p-4 shadow bg-gray-100">
          <h3 className="font-bold mb-2">Expiry P&L Graph</h3>
          <div className="h-40 bg-white border rounded flex items-center justify-center">
            [Graph]
          </div>
        </div>
        <div className="border rounded-lg p-4 shadow bg-gray-100">
          <h3 className="font-bold mb-2">Current P&L</h3>
          <div className="h-40 bg-white border rounded flex items-center justify-center">
            [Graph]
          </div>
        </div>
        <div className="border rounded-lg p-4 shadow bg-gray-100">
          <h3 className="font-bold mb-2">IV Curve & Greeks</h3>
          <div className="h-40 bg-white border rounded flex items-center justify-center">
            [Graph]
          </div>
        </div>
      </div>

      <Button className="mt-2 w-full">Submit Strategy</Button>
    </div>
  );
};

const CreateStrategy = () => {
  const [activeTab, setActiveTab] = useState("Bullish");
  const [selectedStrategy, setSelectedStrategy] = useState("");

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center">Strategy Builder</h1>
      <Tabs
        defaultValue="Bullish"
        onValueChange={val => {
          setActiveTab(val);
          setSelectedStrategy("");
        }}
      >
        <TabsList className="flex justify-center mb-4">
          {Object.keys(strategyCategories).map(category =>
            <TabsTrigger key={category} value={category} className="mx-2">
              {category}
            </TabsTrigger>,
          )}
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {strategyCategories[
          activeTab as keyof typeof strategyCategories
        ].map(strategy =>
          <Card
            key={strategy}
            className={`cursor-pointer transition-transform hover:scale-105 border-2 ${selectedStrategy ===
            strategy
              ? "border-blue-500"
              : "border-transparent"}`}
            onClick={() => setSelectedStrategy(strategy)}
          >
            <CardContent className="p-4 text-center font-semibold">
              {strategy}
            </CardContent>
          </Card>,
        )}
      </div>

      {selectedStrategy && <StrategyDetails strategy={selectedStrategy} />}
    </div>
  );
};

export default CreateStrategy;
