import Address from "../models/address.model.js"


//add address : /api/address/add

export const addAddress = async (req,res) =>{
    try {
        const {address}=req.body
        const userId = req.userId;
        

        if (!userId) {
            return res.status(401).json({ success: false, message: "User not authenticated. Please log in." });
        }
        if (!address) {
            return res.status(400).json({ success: false, message: "Address data is required." });
        }

        await Address.create({...address, userId})

        res.json({success:true, message:"Address added successfully"})
    } catch (error) {
        console.log(error.message);
        res.json({success:false, message:error.message});
    }
}

//get address : api/address/get

export const getAddress = async(req,res)=>{
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: "User not authenticated. Please log in." });
        }
        const addresses =await Address.find({userId})

        res.json({success:true, addresses})
    } catch (error) {
        console.log(error.message);
        res.json({success:false, message:error.message});
    }
}

