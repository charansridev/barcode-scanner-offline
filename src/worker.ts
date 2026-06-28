import { Florence2ForConditionalGeneration, AutoProcessor, env, load_image } from '@huggingface/transformers';

// Use direct fetching from Hugging Face Hub
env.allowLocalModels = false;
// For 8GB RAM, WebGPU is strongly preferred
let model: any = null;
let processor: any = null;

self.onmessage = async (e: MessageEvent) => {
    const { action, image, text } = e.data;

    if (action === 'load') {
        try {
            const model_id = 'onnx-community/Florence-2-base-ft';
            model = await Florence2ForConditionalGeneration.from_pretrained(model_id, {
                device: 'webgpu',
                dtype: 'q4', 
                progress_callback: (progress: any) => {
                    self.postMessage({ status: 'progress', progress });
                }
            });
            processor = await AutoProcessor.from_pretrained(model_id);
            self.postMessage({ status: 'ready' });
        } catch (error: any) {
            self.postMessage({ status: 'error', error: error.message || error.toString() });
        }
    } else if (action === 'predict') {
        if (!model || !processor) {
            self.postMessage({ status: 'error', error: 'Model not loaded' });
            return;
        }

        try {
            // Florence-2 OCR prompt
            const task = '<OCR>';
            const prompts = processor.construct_prompts(task);
            const parsedImage = await load_image(image);
            const inputs = await processor(parsedImage, prompts);
            
            const generated_ids = await model.generate({
                ...inputs,
                max_new_tokens: 256,
            });

            const generated_text = processor.batch_decode(generated_ids, { skip_special_tokens: false })[0];
            const result = processor.post_process_generation(generated_text, task, parsedImage.size);

            let extracted_text = "";
            if (result && result['<OCR>']) {
                extracted_text = result['<OCR>'];
            } else {
                extracted_text = JSON.stringify(result);
            }

            self.postMessage({ status: 'complete', result: extracted_text });
        } catch (error: any) {
            self.postMessage({ status: 'error', error: error.message || error.toString() });
        }
    }
};
