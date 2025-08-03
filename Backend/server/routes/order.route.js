import express from 'express';
import authSeller from '../middlewares/authSeller.js';
import {getAllOrders,getUserOrder,placeOrderCOD,placeOrderStripe} from '../controllers/order.controller.js'
import authUser from '../middlewares/authUser.js';

const orderRouter =express.Router();

orderRouter.post('/cod',authUser,placeOrderCOD);
orderRouter.post('/stripe',authUser,placeOrderStripe);
orderRouter.get('/user',authUser,getUserOrder);
orderRouter.get('/seller',authSeller,getAllOrders);

export default orderRouter;