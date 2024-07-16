'use server'
import qs from 'qs'
import { z } from 'zod'
import { mutateData } from '../services/mutate-data'
import { flattenAttributes } from '@/lib/utils'
import { getUserMeLoader } from '../services/get-user-me-loader'
import { fileDeleteService, fileUploadService } from '../services/file-service'

const schemaProfile = z.object({
  firstName: z.string().min(3).max(20, {
    message: 'First name must be between 3 and 20 characters'
  }),
  lastName: z.string().min(3).max(20, {
    message: 'Last name must be between 3 and 20 characters'
  }),
  bio: z.string().max(200, {
    message: 'Bio must be less than 100 characters'
  })
})

export async function updateProfileAction(userId: string, prevState: any, formData: FormData) {
  const validatedFields = schemaProfile.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    bio: formData.get('bio')
  })

  if(!validatedFields.success) {
    return {
      ...prevState,
      strapiErrors: null,
      zodErrors: validatedFields.error.flatten().fieldErrors,
      message: "Missing fields"
    }
  }

  const query = qs.stringify({ populate: "*"})
  const responseData = await mutateData('PUT', `/api/users/${userId}?${query}`, validatedFields.data)

  if (!responseData) {
    return {
      ...prevState,
      strapiErrors: null,
      message: "An error occurred"
    }
  }

  if(responseData.error) {
    return {
      ...prevState,
      strapiErrors: responseData.error,
      message: "An error occurred"
    }
  }

  const flattenedData = flattenAttributes(responseData)

  return {
    ...prevState,
    message: "Profile updated",
    data: flattenedData,
    strapiErrors: null
  }
}

const MAX_FILE_SIZE = 5000000;

const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

// VALIDATE IMAGE WITH ZOD 
const imageSchema = z.object({
  image: z
    .any()
    .refine((file) => {
      if (file.size === 0 || file.name === undefined) return false;
      else return true;
    }, "Please update or add new image.")

    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
      ".jpg, .jpeg, .png and .webp files are accepted."
    )
    .refine((file) => file.size <= MAX_FILE_SIZE, `Max file size is 5MB.`),
});

export async function uploadProfileImageAction(
  imageId: string,
  prevState: any,
  formData: FormData
) {

  // GET THE LOGGED IN USER
  const user = await getUserMeLoader();
  if (!user.ok) throw new Error("You are not authorized to perform this action.");
  
  const userId = user.data.id;

  // CONVERT FORM DATA TO OBJECT
  const data = Object.fromEntries(formData);

  // VALIDATE THE IMAGE
  const validatedFields = imageSchema.safeParse({
    image: data.image,
  });

  if (!validatedFields.success) {
    return {
      ...prevState,
      zodErrors: validatedFields.error.flatten().fieldErrors,
      strapiErrors: null,
      data: null,
      message: "Invalid Image",
    };
  }

  // DELETE PREVIOUS IMAGE IF EXISTS
  if (imageId) {
    try {
      await fileDeleteService(imageId);
    } catch (error) {
      return {
        ...prevState,
        strapiErrors: null,
        zodErrors: null,
        message: "Failed to Delete Previous Image.",
      };
    }
  }


  // UPLOAD NEW IMAGE TO MEDIA LIBRARY
  const fileUploadResponse = await fileUploadService(data.image);

  if (!fileUploadResponse) {
    return {
      ...prevState,
      strapiErrors: null,
      zodErrors: null,
      message: "Ops! Something went wrong. Please try again.",
    };
  }

  if (fileUploadResponse.error) {
    return {
      ...prevState,
      strapiErrors: fileUploadResponse.error,
      zodErrors: null,
      message: "Failed to Upload File.",
    };
  }
  const updatedImageId = fileUploadResponse[0].id;
  const payload = { image: updatedImageId };

  // UPDATE USER PROFILE WITH NEW IMAGE
  const updateImageResponse = await mutateData(
    "PUT",
    `/api/users/${userId}`,
    payload
  );
  const flattenedData = flattenAttributes(updateImageResponse);

  return {
    ...prevState,
    data: flattenedData,
    zodErrors: null,
    strapiErrors: null,
    message: "Image Uploaded",
  };
}