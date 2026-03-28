import fs from "fs";
import pdf from "pdf-parse";

export const parseResume = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdf(dataBuffer);

  const text = data.text;

  return {
    skills: text.match(/JavaScript|Python|React|Node/gi) || [],
    education: text.match(/B\.?Tech|MBA|MBBS/gi) || [],
  };
};