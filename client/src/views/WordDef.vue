<template>
	<div>
		<appInfoBarComp :info="wordsInfo" />

		<div class="mt-12">
			<v-stepper v-model="el">

				<v-stepper-header>
					<template v-for="n in steps">
						<v-stepper-step :key="`word-${n}`" color="#673ab7" :step="n" editable>
							<!-- Word {{ n }} -->
						</v-stepper-step>

						<v-divider v-if="n !== steps" :key="n"></v-divider>
					</template>
				</v-stepper-header>

				<v-stepper-items>
					<v-stepper-content class="pb-2" v-for="n in steps" :key="`${n}-content`" :step="n">
						<v-card class="mx-auto">
							<v-list-item three-line>
								<v-list-item-content>
									<div class="d-flex justify-space-between">
										<div class="overline">{{exactDetails[n-1].translation}}</div>
										<div class="overline">{{exactDetails[n-1].pos}}</div>
									</div>
									
									<v-list-item-title class="headline mb-1 text-uppercase">{{exactDetails[n-1].text}}</v-list-item-title>
									<v-list-item-subtitle>{{exactDetails[n-1].transcript}}</v-list-item-subtitle>									
								</v-list-item-content>
								<!-- <v-list-item-avatar tile size="80" color="grey"></v-list-item-avatar> -->
							</v-list-item>
							<v-divider></v-divider>
							<v-card-text>
								<!-- <p>{{exactDetails[n-1].pos}}</p> -->
								<div v-if="exactDetails[n-1].examples">
									<p>
										
										<span class="title font-weight-light black--text">Example</span>
										<br>
										{{exactDetails[n-1].examples[0].text}}
										<br>
										{{exactDetails[n-1].examples[0].tr[0].text}}
									</p>
								</div>
							</v-card-text>
							<!-- <v-card-actions>
								<v-btn text color="deep-purple accent-4">
									Learn More
								</v-btn>
							</v-card-actions> -->
						</v-card>
					</v-stepper-content>
					<div class="d-flex mx-2 mb-2">
						<v-btn large text @click="el==1?el=steps:el--" class="white--text" color="#673ab7">
							<!-- <v-icon left>mdi-chevron-left</v-icon> -->
							Back
						</v-btn>
						<v-spacer></v-spacer>
						<v-btn large @click="el==steps?canGoNext():el++" class="white--text" color="#673ab7">
							<!-- <v-icon left>mdi-chevron-right</v-icon> -->
							Next
						</v-btn>
					</div>
				</v-stepper-items>
			</v-stepper>
		</div>
		<!-- <v-row>
			<v-col cols="6">
				<div>
					<v-btn block outlined color="purple darken-4" x-large @click="$router.go(-1)">Back</v-btn>
				</div>
			</v-col> 
			<v-col cols="12">
				<div>
					<v-btn block :disabled="steps != el" color="purple darken-4 white--text" x-large @click="canGoNext()">Next</v-btn>
				</div>
			</v-col>
		</v-row> -->

		<v-overlay absolute :value="overlay">
			<v-card color="purple" dark>
				<v-card-text>
					Generating practice tasks
					<v-progress-linear indeterminate color="white" class="mb-0"></v-progress-linear>
				</v-card-text>
			</v-card>
		</v-overlay>
	</div>
</template>
<script>
	import appInfoBarComp from "@/components/InfoBar";

	export default {
		components: {
			appInfoBarComp
		},
		data: () => ({
			wordsInfo: "Carefully learn the word's details",
			exactDetails: [],
			wordInputs: [],
			steps: 3,
			el: 1,
			overlay: false
		}),
		methods: {
			nextStep(n) {
				if (n === this.steps) {
					this.e1 = 1;
				} else {
					this.e1 = n + 1;
				}
			},
			async canGoNext() {
				this.overlay = true;

				//prepare data for task
				await this.generateRandForWordsTask(6);
				await this.findPicsUrl(this.wordInputs);

				this.overlay = false;
				//go to tasks
				this.$router.push("/part-1");
			},
			async generateRandForWordsTask(numOfRandom) {
				// console.log("going to random");
				//get random number
				const random = Math.floor(Math.random() * Math.floor(2000));
				const randWordsEng = await this.$http
					.get(`api/firebase-randword/${random}/${numOfRandom}`)
					.then(res => {
						//extract random words from object
						const engRand = res.data.data.map(word => {
							return word.value;
						});
						return engRand;
					})
					.catch(err => console.log(err));

				//translate random words to russian
				const randWordsRus = await this.$http
					.get("/api/yandex-translate/" + randWordsEng)
					.then(res => {
						return res.data.text[0].split(",");
					});

				// searching for pic of random words
				const randImageUrls = await this.$http
					.get("api/unsplash/random/" + randWordsEng.length)
					.then(res => {
						//extract random words from object
						return res.data;
					})
					.catch(err => console.log(err));

				this.$store.commit("setRandomWords", {
					eng: randWordsEng,
					ru: randWordsRus,
					img: randImageUrls
				});
			},
			async findPicsUrl(wordList) {
				const searchImgURLs = [];
				for (let i = 0; i < wordList.length; i++) {
					// searching for pic url
					searchImgURLs.push(this.$http
						.get("api/unsplash/" + wordList[i])
						.then(res => {
							//extract random words from object
							return res.data;
						})
						.catch(err => console.log(err)));
				}

				const processedURLs = await Promise
					.all(searchImgURLs)
					.catch(errors => {
						// react on errors.
						console.error(errors);
					});

				// console.log(processedURLs)

				this.$store.commit("setWordPicsUrls", processedURLs);
			}
		},
		mounted() {},
		//On refresh get words for display
		created() {
			this.exactDetails = this.$store.getters.getExactWordsDetails;
			this.wordInputs = this.$store.getters.getWords;
			if (this.wordInputs) {
				this.steps = this.wordInputs.length;
			} else {
				this.$router.go(-1);
			}
		}
	};
</script>