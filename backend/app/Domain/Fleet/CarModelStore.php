<?php

namespace App\Domain\Fleet;

use App\Domain\Media\ImageReencoder;
use App\Models\Car;
use App\Models\CarModel3d;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * A car's glTF model and poster on the public disk. Replacing the file increments
 * `model_version`, so markers placed on the old model are flagged for repositioning.
 */
final class CarModelStore
{
    public const DISK = 'public';

    public const POSTER_WIDTH = 1600;

    public function __construct(
        private readonly GlbValidator $validator,
        private readonly ImageReencoder $images,
    ) {}

    /**
     * @param  array{source_name: string, source_url: ?string, license: string, is_illustrative: bool}  $credit
     * @return array{0: CarModel3d, 1: ?int} The model and the previous model version (null on first upload).
     *
     * @throws InvalidModelFile
     */
    public function save(Car $car, UploadedFile $file, array $credit): array
    {
        $this->validator->validate((string) $file->getRealPath());

        $disk = Storage::disk(self::DISK);
        $path = $file->storeAs("cars/{$car->id}/models", Str::uuid()->toString().'.glb', self::DISK);
        if ($path === false) {
            throw new \RuntimeException('The model could not be stored.');
        }

        try {
            [$model, $previousVersion, $oldFiles] = DB::transaction(function () use ($car, $file, $credit, $path): array {
                Car::query()->whereKey($car->id)->lockForUpdate()->firstOrFail();
                $model = CarModel3d::query()->where('car_id', $car->id)->first();
                $oldFiles = $model !== null ? array_filter([$model->file_path, $model->poster_path]) : [];
                $previousVersion = $model?->model_version;

                $model ??= new CarModel3d(['car_id' => $car->id]);
                $model->fill([
                    ...$credit,
                    'file_path' => $path,
                    'file_size' => (int) $file->getSize(),
                    'poster_path' => null,
                    'model_version' => $previousVersion === null ? 1 : $previousVersion + 1,
                ])->save();

                return [$model, $previousVersion, $oldFiles];
            });
        } catch (\Throwable $exception) {
            $disk->delete($path);

            throw $exception;
        }

        $disk->delete($oldFiles);

        return [$model->refresh(), $previousVersion];
    }

    /**
     * @param  array<string, mixed>  $values  camera, is_illustrative, source_name, source_url, license
     * @return array{0: CarModel3d, 1: array<string, array{0: mixed, 1: mixed}>}
     */
    public function update(CarModel3d $model, array $values): array
    {
        $model->fill($values);
        $changes = [];
        foreach (array_keys($model->getDirty()) as $field) {
            $changes[$field] = [$model->getOriginal($field), $model->getAttribute($field)];
        }
        $model->save();

        return [$model->refresh(), $changes];
    }

    public function savePoster(CarModel3d $model, string $bytes): CarModel3d
    {
        $webp = $this->images->webp($bytes, self::POSTER_WIDTH);
        $path = "cars/{$model->car_id}/models/".Str::uuid()->toString().'-poster.webp';
        $disk = Storage::disk(self::DISK);
        $disk->put($path, $webp);

        $old = $model->poster_path;
        $model->forceFill(['poster_path' => $path])->save();
        if ($old !== null) {
            $disk->delete($old);
        }

        return $model->refresh();
    }

    public function delete(CarModel3d $model): void
    {
        $files = array_filter([$model->file_path, $model->poster_path]);
        $model->delete();
        Storage::disk(self::DISK)->delete($files);
    }
}
