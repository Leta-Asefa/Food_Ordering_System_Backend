const Item = require('../Models/Item');

// Create a new item
exports.createItem = async (req, res) => {
    try {
        const newItem = new Item(req.body);
        const savedItem = await newItem.save();
        res.status(201).json(savedItem);
    } catch (error) {
        console.log(error)
        res.status(400).json({ message: error.message });
    }
};

// Get all items
exports.getAllItems = async (req, res) => {
    try {
        const items = await Item.find();
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all food  Consider fetching using restaurant id
exports.getAllFood = async (req, res) => {
    try {
        const items = await Item.find({type:'Food'});
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all drink
exports.getAllDrink = async (req, res) => {
    try {
        const items = await Item.find({type:'Drink'});
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all catering
exports.getAllCatering = async (req, res) => {
    try {
        const items = await Item.find({type:'Catering'});
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get menu by RestaurantId
exports.getMenuByRestaurantId = async (req, res) => {
    
    try {
        const fasting = await Item.find({restaurantId:req.params.restaurantId,type:'Food',isFasting:true});
        const nonfasting = await Item.find({restaurantId:req.params.restaurantId,type:'Food',isFasting:false});
        const drink = await Item.find({restaurantId:req.params.restaurantId,type:'Drink'});
        const catering = await Item.find({restaurantId:req.params.restaurantId,type:'Catering'});

        res.status(200).json({fasting,nonfasting,drink,catering});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Get an item by ID
exports.getItemById = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        res.status(200).json(item);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update an item by ID
exports.updateItemById = async (req, res) => {
    try {
        const updatedItem = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedItem) {
            return res.status(404).json({ message: 'Item not found' });
        }
        res.status(200).json({message:'Item Updated successfully !'});
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete an item by ID
exports.deleteItemById = async (req, res) => {
    try {
        const deletedItem = await Item.findByIdAndDelete(req.params.id);
        if (!deletedItem) {
            return res.status(404).json({ message: 'Item not found' });
        }
        res.status(200).json({ message: 'Item deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
