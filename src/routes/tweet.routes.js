import { Router } from 'express';
import {
  createTweet,
  deleteTweet,
  getUserTweets,
  updateTweet
} from "../controllers/tweet.controller.js";
import { verifyJWT } from '../middlewares/auth.middleware.js';


const router = Router()


router.route("/create-tweet").post(verifyJWT, createTweet);
router.route("/update-tweet/:tweetId").patch(verifyJWT, updateTweet);
router.route("/delete-tweet/:tweetId").delete(verifyJWT, deleteTweet);



// non secure
router.route("/get-user-tweet/:userId").get(getUserTweets)

export default router