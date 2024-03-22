import baseObjects from '../schemas/baseObjects';
function createRandString({ length }) {
    const selection = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const randomLength = selection.length;
    let result = '';
    for (let i = 0; i < length; i += 1) {
        const randomVal = Math.round(Math.random() * (randomLength - 1));
        result += selection[randomVal];
    }
    return result;
}
function buildLiteSchema(schema) {
    const updatedSchema = schema;
    const baseObjectSchema = baseObjects.liteBaseObject;
    updatedSchema.required = baseObjectSchema.required.concat(schema.required);
    Object.keys(baseObjectSchema.properties)
        .forEach((key) => {
        updatedSchema.properties[key] = baseObjectSchema.properties[key];
    });
    return updatedSchema;
}
function buildFullSchema(schema) {
    const updatedSchema = schema;
    const baseObjectSchema = baseObjects.fullBaseObject;
    updatedSchema.required = baseObjectSchema.required.concat(schema.required);
    Object.keys(baseObjectSchema.properties)
        .forEach((key) => {
        updatedSchema.properties[key] = baseObjectSchema.properties[key];
    });
    return updatedSchema;
}
export { createRandString };
export { buildFullSchema };
export { buildLiteSchema };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0b29scy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLFdBQVcsTUFBTSx3QkFBd0IsQ0FBQztBQVFqRCxTQUFTLGdCQUFnQixDQUFDLEVBQUUsTUFBTSxFQUFFO0lBQ2xDLE1BQU0sU0FBUyxHQUFHLHNDQUFzQyxDQUFDO0lBQ3pELE1BQU0sWUFBWSxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUM7SUFDdEMsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO0lBRWhCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1FBQ25DLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsWUFBWSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFakUsTUFBTSxJQUFJLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNqQyxDQUFDO0lBRUQsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQztBQU9ELFNBQVMsZUFBZSxDQUFDLE1BQU07SUFDN0IsTUFBTSxhQUFhLEdBQUcsTUFBTSxDQUFDO0lBQzdCLE1BQU0sZ0JBQWdCLEdBQUcsV0FBVyxDQUFDLGNBQWMsQ0FBQztJQUVwRCxhQUFhLENBQUMsUUFBUSxHQUFHLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQzNFLE1BQU0sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDO1NBQ3JDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFO1FBQ2YsYUFBYSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsR0FBRyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDbkUsQ0FBQyxDQUFDLENBQUM7SUFFTCxPQUFPLGFBQWEsQ0FBQztBQUN2QixDQUFDO0FBT0QsU0FBUyxlQUFlLENBQUMsTUFBTTtJQUM3QixNQUFNLGFBQWEsR0FBRyxNQUFNLENBQUM7SUFDN0IsTUFBTSxnQkFBZ0IsR0FBRyxXQUFXLENBQUMsY0FBYyxDQUFDO0lBRXBELGFBQWEsQ0FBQyxRQUFRLEdBQUcsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDM0UsTUFBTSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUM7U0FDckMsT0FBTyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7UUFDZixhQUFhLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxHQUFHLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNuRSxDQUFDLENBQUMsQ0FBQztJQUVMLE9BQU8sYUFBYSxDQUFDO0FBQ3ZCLENBQUM7QUFFRCxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsQ0FBQztBQUM1QixPQUFPLEVBQUUsZUFBZSxFQUFFLENBQUM7QUFDM0IsT0FBTyxFQUFFLGVBQWUsRUFBRSxDQUFDIn0=