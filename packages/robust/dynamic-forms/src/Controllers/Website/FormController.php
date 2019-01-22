<?php

namespace Robust\DynamicForms\Controllers\Website;

use App\Http\Controllers\Controller;
use Robust\Core\Controllers\Website\Traits\CrudTrait;
use Robust\Core\Controllers\Website\Traits\ViewTrait;
use Robust\DynamicForms\Repositories\Admin\FormRepository;


/**
 * Class FormController
 * @package Robust\DynamicForms\Controllers\Admin
 */
class FormController extends Controller
{
    use CrudTrait, ViewTrait;
    /**
     * FormController constructor.
     * @param FormRepository $model
     */
    public function __construct(FormRepository $model)
    {
        $this->model = $model;
    }

    /**
     * @param $slug
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function show($slug)
    {
        $model = $this->model->where('slug', $slug)->first();
        return view('dynamic-forms::website.users.forms.view', compact('model'));
    }
}
