export const getPublicData = (req, res) => {
  res.json({ message: "This is a public route accessible without login." });
};
