import mongoose from "mongoose";

const uri_srv = "mongodb+srv://Saniya:Gunjit1234@cluster0.hbdnqlb.mongodb.net/SmartFinancialAdvisor?appName=Cluster0";
const uri_standard = "mongodb://Saniya:Gunjit1234@ac-lekymhh-shard-00-00.hbdnqlb.mongodb.net:27017,ac-lekymhh-shard-00-01.hbdnqlb.mongodb.net:27017,ac-lekymhh-shard-00-02.hbdnqlb.mongodb.net:27017/SmartFinancialAdvisor?ssl=true&replicaSet=atlas-4bu015-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";

async function test() {
  try {
    console.log("Trying standard URI...");
    await mongoose.connect(uri_standard);
    console.log("Standard URI connected!");
    process.exit(0);
  } catch (err) {
    console.error("Standard URI failed:", err.message);
    process.exit(1);
  }
}

test();
